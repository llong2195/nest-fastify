import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { BaseService } from '@/common/base/base.service';
import { LoggerService } from '@/common/logger/custom.logger';
import { KafkaTopic } from '@/common/enums/auction.enum';
import {
  AuctionEntity,
  AuctionStatus,
} from '@/database/pg/entities/entities/auction.entity';
import {
  BidEntity,
  BidStatus,
} from '@/database/pg/entities/entities/bid.entity';
import {
  BidPlacedPayload,
  BidOutbidPayload,
} from '@/common/interface/domain-event.interface';

import { PlaceBidDto } from '../dto/auction.dto';
import { OutboxService } from './outbox.service';

@Injectable()
export class BidService extends BaseService<BidEntity, Repository<BidEntity>> {
  constructor(
    @InjectRepository(BidEntity)
    private readonly bidRepository: Repository<BidEntity>,
    @InjectRepository(AuctionEntity)
    private readonly auctionRepository: Repository<AuctionEntity>,
    private readonly outboxService: OutboxService,
    logger: LoggerService,
  ) {
    super(bidRepository, logger);
  }

  /**
   * Place a bid on an auction.
   * Uses pessimistic locking to prevent race conditions.
   * Writes bid + outbox events atomically.
   */
  async placeBid(dto: PlaceBidDto, bidderId: number): Promise<BidEntity> {
    const idempotencyKey = dto.idempotencyKey ?? randomUUID();

    // Check for duplicate bid (idempotency)
    const existingBid = await this.bidRepository.findOne({
      where: { idempotencyKey },
    });
    if (existingBid) {
      this.logger.warn(
        `Duplicate bid detected: idempotencyKey=${idempotencyKey}`,
      );
      return existingBid;
    }

    return this.transactionWrap(async (manager: EntityManager) => {
      // Lock the auction row to prevent race conditions
      const auction = await manager.findOne(AuctionEntity, {
        where: { id: dto.auctionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!auction) {
        throw new BadRequestException('Auction not found');
      }
      if (auction.status !== AuctionStatus.ACTIVE) {
        throw new BadRequestException('Auction is not active');
      }
      if (auction.sellerId === bidderId) {
        throw new BadRequestException(
          'Sellers cannot bid on their own auction',
        );
      }
      if (new Date() > auction.endTime) {
        throw new BadRequestException('Auction has already ended');
      }

      const currentPrice = Number(auction.currentPrice);
      const minBidIncrement = Number(auction.minBidIncrement);
      const bidAmount = Number(dto.amount);

      if (bidAmount < currentPrice + minBidIncrement) {
        throw new BadRequestException(
          `Bid must be at least ${currentPrice + minBidIncrement}. ` +
            `Current price: ${currentPrice}, minimum increment: ${minBidIncrement}`,
        );
      }

      // Find the previous highest bidder for outbid notification
      const previousHighestBid = await manager.findOne(BidEntity, {
        where: { auctionId: dto.auctionId, status: BidStatus.VALID },
        order: { amount: 'DESC' },
      });

      // Mark previous highest bid as outbid
      if (previousHighestBid) {
        previousHighestBid.status = BidStatus.OUTBID;
        await manager.save(BidEntity, previousHighestBid);
      }

      // Create the new bid
      const bid = manager.create(BidEntity, {
        auctionId: dto.auctionId,
        bidderId,
        amount: bidAmount,
        status: BidStatus.VALID,
        idempotencyKey,
      });
      const savedBid = await manager.save(BidEntity, bid);

      // Update auction current price and bid count
      auction.currentPrice = bidAmount;
      auction.totalBids += 1;
      await manager.save(AuctionEntity, auction);

      // Emit bid.placed event
      const bidPlacedPayload: BidPlacedPayload = {
        bidId: savedBid.id,
        bidderId,
        amount: bidAmount,
        previousPrice: currentPrice,
        totalBids: auction.totalBids,
      };
      await this.outboxService.writeEvent(
        manager,
        KafkaTopic.BID_PLACED,
        dto.auctionId,
        bidPlacedPayload,
      );

      // Emit bid.outbid event if someone was outbid
      if (previousHighestBid) {
        const outbidPayload: BidOutbidPayload = {
          outbidBidderId: previousHighestBid.bidderId,
          outbidBidId: previousHighestBid.id,
          newBidId: savedBid.id,
          newBidderId: bidderId,
          newAmount: bidAmount,
        };
        await this.outboxService.writeEvent(
          manager,
          KafkaTopic.BID_OUTBID,
          dto.auctionId,
          outbidPayload,
        );
      }

      return savedBid;
    });
  }

  /**
   * Get bid history for an auction.
   */
  async getBidHistory(auctionId: number, page = 1, limit = 20) {
    return this._paginate(
      page,
      limit,
      { auctionId, deleted: false },
      undefined,
      {
        order: { createdAt: 'DESC' },
      },
    );
  }

  /**
   * Get bids by a specific user.
   */
  async getUserBids(userId: number, page = 1, limit = 20) {
    return this._paginate(
      page,
      limit,
      { bidderId: userId, deleted: false },
      undefined,
      {
        order: { createdAt: 'DESC' },
      },
    );
  }
}
