import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindOptionsWhere,
  LessThanOrEqual,
  Repository,
} from 'typeorm';

import { BaseService } from '@/common/base/base.service';
import { LoggerService } from '@/common/logger/custom.logger';
import { KafkaTopic } from '@/common/enums/auction.enum';
import {
  AuctionEntity,
  AuctionStatus,
} from '@/database/pg/entities/entities/auction.entity';
import {
  AuctionCreatedPayload,
  AuctionCancelledPayload,
  AuctionStartedPayload,
  AuctionEndedPayload,
  AuctionWinnerSelectedPayload,
} from '@/common/interface/domain-event.interface';
import {
  BidEntity,
  BidStatus,
} from '@/database/pg/entities/entities/bid.entity';

import { CreateAuctionDto, UpdateAuctionDto } from '../dto/auction.dto';
import { OutboxService } from './outbox.service';

@Injectable()
export class AuctionService extends BaseService<
  AuctionEntity,
  Repository<AuctionEntity>
> {
  constructor(
    @InjectRepository(AuctionEntity)
    private readonly auctionRepository: Repository<AuctionEntity>,
    @InjectRepository(BidEntity)
    private readonly bidRepository: Repository<BidEntity>,
    private readonly outboxService: OutboxService,
    logger: LoggerService,
  ) {
    super(auctionRepository, logger);
  }

  /**
   * Create a new auction within a transaction.
   * Writes auction + outbox event atomically.
   */
  async createAuction(
    dto: CreateAuctionDto,
    sellerId: number,
  ): Promise<AuctionEntity> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
    if (startTime <= new Date()) {
      throw new BadRequestException('Start time must be in the future');
    }

    return this.transactionWrap(async (manager: EntityManager) => {
      const auction = new AuctionEntity({
        title: dto.title,
        description: dto.description ?? '',
        startingPrice: dto.startingPrice,
        currentPrice: dto.startingPrice,
        minBidIncrement: dto.minBidIncrement ?? 1,
        startTime,
        endTime,
        status: AuctionStatus.SCHEDULED,
        sellerId,
        totalBids: 0,
        category: dto.category ?? null,
        imageUrl: dto.imageUrl ?? null,
      } as Partial<AuctionEntity>);

      const saved = await manager.save(AuctionEntity, auction);

      const payload: AuctionCreatedPayload = {
        title: saved.title,
        description: saved.description,
        startingPrice: Number(saved.startingPrice),
        minBidIncrement: Number(saved.minBidIncrement),
        startTime: saved.startTime.toISOString(),
        endTime: saved.endTime.toISOString(),
        sellerId: saved.sellerId,
        category: saved.category ?? undefined,
        imageUrl: saved.imageUrl ?? undefined,
      };

      await this.outboxService.writeEvent(
        manager,
        KafkaTopic.AUCTION_CREATED,
        saved.id,
        payload,
      );

      return saved;
    });
  }

  async updateAuction(
    id: number,
    dto: UpdateAuctionDto,
    userId: number,
  ): Promise<AuctionEntity | null> {
    const auction = await this.auctionRepository.findOne({ where: { id } });
    if (!auction) {
      throw new BadRequestException('Auction not found');
    }
    if (auction.sellerId !== userId) {
      throw new BadRequestException('Only the seller can update this auction');
    }
    if (auction.status !== AuctionStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled auctions can be updated');
    }

    return this._update(id, dto);
  }

  /**
   * Start an auction (called by BullMQ scheduler).
   */
  async startAuction(auctionId: number): Promise<AuctionEntity> {
    return this.transactionWrap(async (manager: EntityManager) => {
      const auction = await manager.findOne(AuctionEntity, {
        where: { id: auctionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!auction) {
        throw new BadRequestException('Auction not found');
      }
      if (auction.status !== AuctionStatus.SCHEDULED) {
        this.logger.warn(
          `Auction ${auctionId} cannot be started, current status=${auction.status}`,
        );
        return auction;
      }

      auction.status = AuctionStatus.ACTIVE;
      const saved = await manager.save(AuctionEntity, auction);

      const payload: AuctionStartedPayload = {
        startTime: saved.startTime.toISOString(),
        currentPrice: Number(saved.currentPrice),
      };

      await this.outboxService.writeEvent(
        manager,
        KafkaTopic.AUCTION_STARTED,
        saved.id,
        payload,
      );

      return saved;
    });
  }

  /**
   * End an auction and select winner (called by BullMQ scheduler).
   */
  async endAuction(auctionId: number): Promise<AuctionEntity> {
    return this.transactionWrap(async (manager: EntityManager) => {
      const auction = await manager.findOne(AuctionEntity, {
        where: { id: auctionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!auction) {
        throw new BadRequestException('Auction not found');
      }
      if (auction.status !== AuctionStatus.ACTIVE) {
        this.logger.warn(
          `Auction ${auctionId} cannot be ended, current status=${auction.status}`,
        );
        return auction;
      }

      auction.status = AuctionStatus.ENDED;

      // Find winning bid (highest valid bid)
      const winningBid = await manager.findOne(BidEntity, {
        where: { auctionId, status: BidStatus.VALID },
        order: { amount: 'DESC' },
      });

      if (winningBid) {
        auction.winnerId = winningBid.bidderId;
        auction.winningBidId = winningBid.id;
        winningBid.status = BidStatus.WINNER;
        await manager.save(BidEntity, winningBid);
      }

      const saved = await manager.save(AuctionEntity, auction);

      // Emit auction.ended event
      const endedPayload: AuctionEndedPayload = {
        endTime: saved.endTime.toISOString(),
        finalPrice: Number(saved.currentPrice),
        totalBids: saved.totalBids,
        winnerId: saved.winnerId,
      };
      await this.outboxService.writeEvent(
        manager,
        KafkaTopic.AUCTION_ENDED,
        saved.id,
        endedPayload,
      );

      // Emit winner_selected event if there's a winner
      if (winningBid) {
        const winnerPayload: AuctionWinnerSelectedPayload = {
          winnerId: winningBid.bidderId,
          winningBidId: winningBid.id,
          finalPrice: Number(winningBid.amount),
        };
        await this.outboxService.writeEvent(
          manager,
          KafkaTopic.AUCTION_WINNER_SELECTED,
          saved.id,
          winnerPayload,
        );
      }

      return saved;
    });
  }

  /**
   * Cancel an auction.
   */
  async cancelAuction(
    auctionId: number,
    userId: number,
    reason: string,
  ): Promise<AuctionEntity> {
    return this.transactionWrap(async (manager: EntityManager) => {
      const auction = await manager.findOne(AuctionEntity, {
        where: { id: auctionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!auction) {
        throw new BadRequestException('Auction not found');
      }
      if (auction.sellerId !== userId) {
        throw new BadRequestException(
          'Only the seller can cancel this auction',
        );
      }
      if (
        auction.status !== AuctionStatus.SCHEDULED &&
        auction.status !== AuctionStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'Only scheduled or active auctions can be cancelled',
        );
      }

      auction.status = AuctionStatus.CANCELLED;
      const saved = await manager.save(AuctionEntity, auction);

      const payload: AuctionCancelledPayload = {
        reason,
        cancelledBy: userId,
      };
      await this.outboxService.writeEvent(
        manager,
        KafkaTopic.AUCTION_CANCELLED,
        saved.id,
        payload,
      );

      return saved;
    });
  }

  /**
   * Find auctions that need to start (for scheduler).
   */
  async findAuctionsToStart(): Promise<AuctionEntity[]> {
    return this.auctionRepository.find({
      where: {
        status: AuctionStatus.SCHEDULED,
        startTime: LessThanOrEqual(new Date()),
      },
    });
  }

  /**
   * Find auctions that need to end (for scheduler).
   */
  async findAuctionsToEnd(): Promise<AuctionEntity[]> {
    return this.auctionRepository.find({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: LessThanOrEqual(new Date()),
      },
    });
  }

  /**
   * Get auction by ID with bid count.
   */
  async getAuctionById(id: number): Promise<AuctionEntity | null> {
    return this.auctionRepository.findOne({
      where: { id },
      relations: ['bids'],
    });
  }

  /**
   * List auctions with filtering and pagination.
   */
  async listAuctions(page = 1, limit = 20, status?: string, category?: string) {
    const where: FindOptionsWhere<AuctionEntity> = { deleted: false };

    if (status) {
      where.status = status as AuctionStatus;
    }
    if (category) {
      where.category = category;
    }

    return this._paginate(page, limit, where);
  }
}
