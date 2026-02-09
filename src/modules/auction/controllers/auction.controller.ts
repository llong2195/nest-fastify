import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { BaseController } from '@/common/base/base.controller';
import { BaseResponseDto } from '@/common/base/base.dto';
import { PaginationResponse } from '@/common/base/pagination.dto';
import { I18nService } from '@/common/shared/i18n.service';
import { AuctionJobName, AuctionQueueName } from '@/common/enums/auction.enum';
import { AuctionEntity } from '@/database/pg/entities/entities/auction.entity';

import {
  AuctionListQueryDto,
  CancelAuctionDto,
  CreateAuctionDto,
  PlaceBidDto,
  UpdateAuctionDto,
} from '../dto/auction.dto';
import { AuctionService } from '../services/auction.service';
import { BidService } from '../services/bid.service';

@ApiTags('Auctions')
@Controller({ version: '1', path: 'auctions' })
export class AuctionController extends BaseController {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly bidService: BidService,
    @InjectQueue(AuctionQueueName.BID_PROCESSING)
    private readonly bidQueue: Queue,
    i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * Create a new auction.
   * The actual creation is processed via BullMQ for consistency.
   */
  @Post()
  async createAuction(
    @Body() dto: CreateAuctionDto,
  ): Promise<BaseResponseDto<AuctionEntity>> {
    try {
      // TODO: Extract sellerId from JWT token via @CurrentUser decorator
      const sellerId = 1;
      const auction = await this.auctionService.createAuction(dto, sellerId);
      return BaseResponseDto.Ok(auction);
    } catch (error) {
      this.throwErrorProcess(error);
      throw error;
    }
  }

  /**
   * Get auction by ID.
   */
  @Get(':id')
  async getAuction(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<AuctionEntity>> {
    try {
      const auction = await this.auctionService.getAuctionById(id);
      return BaseResponseDto.Ok(auction);
    } catch (error) {
      this.throwErrorProcess(error);
      throw error;
    }
  }

  /**
   * List auctions with optional filters.
   */
  @Get()
  async listAuctions(
    @Query() query: AuctionListQueryDto,
  ): Promise<PaginationResponse<AuctionEntity>> {
    try {
      return this.auctionService.listAuctions(
        query.page,
        query.limit,
        query.status,
        query.category,
      );
    } catch (error) {
      this.throwErrorProcess(error);
      throw error;
    }
  }

  /**
   * Update a scheduled auction.
   */
  @Patch(':id')
  async updateAuction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAuctionDto,
  ): Promise<BaseResponseDto<AuctionEntity | null>> {
    try {
      const userId = 1; // TODO: Extract from JWT
      const auction = await this.auctionService.updateAuction(id, dto, userId);
      return BaseResponseDto.Ok(auction);
    } catch (error) {
      this.throwErrorProcess(error);
      throw error;
    }
  }

  /**
   * Cancel an auction.
   */
  @Post(':id/cancel')
  async cancelAuction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelAuctionDto,
  ): Promise<BaseResponseDto<AuctionEntity>> {
    try {
      const userId = 1; // TODO: Extract from JWT
      const auction = await this.auctionService.cancelAuction(
        id,
        userId,
        dto.reason,
      );
      return BaseResponseDto.Ok(auction);
    } catch (error) {
      this.throwErrorProcess(error);
      throw error;
    }
  }

  /**
   * Place a bid on an auction.
   * Bid processing is done via BullMQ worker for race condition safety.
   */
  @Post('bids')
  async placeBid(
    @Body() dto: PlaceBidDto,
  ): Promise<BaseResponseDto<{ jobId: string }>> {
    try {
      const bidderId = 2; // TODO: Extract from JWT
      const job = await this.bidQueue.add(
        AuctionJobName.PLACE_BID,
        {
          ...dto,
          bidderId,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      );
      return BaseResponseDto.Ok({ jobId: job.id ?? 'unknown' });
    } catch (error) {
      this.throwErrorProcess(error);
      throw error;
    }
  }

  /**
   * Get bid history for an auction.
   */
  @Get(':id/bids')
  async getBidHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    try {
      return this.bidService.getBidHistory(id, page, limit);
    } catch (error) {
      this.throwErrorProcess(error);
      throw error;
    }
  }
}
