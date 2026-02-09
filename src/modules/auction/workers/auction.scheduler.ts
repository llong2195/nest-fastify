import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { AuctionJobName, AuctionQueueName } from '@/common/enums/auction.enum';

import { AuctionService } from '../services/auction.service';

/**
 * Scheduler that polls for auctions needing to start or end.
 * Runs every 5 seconds for near-realtime auction lifecycle management.
 */
@Injectable()
export class AuctionScheduler {
  private readonly logger = new Logger(AuctionScheduler.name);

  constructor(
    private readonly auctionService: AuctionService,
    @InjectQueue(AuctionQueueName.AUCTION_PROCESSING)
    private readonly auctionQueue: Queue,
  ) {}

  /**
   * Check for auctions that need to start.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkAuctionsToStart(): Promise<void> {
    try {
      const auctions = await this.auctionService.findAuctionsToStart();
      for (const auction of auctions) {
        await this.auctionQueue.add(
          AuctionJobName.START_AUCTION,
          { auctionId: auction.id },
          {
            jobId: `start-auction-${auction.id}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
          },
        );
        this.logger.debug(`Scheduled start for auction ${auction.id}`);
      }
    } catch (error) {
      this.logger.error(
        'Error checking auctions to start',
        (error as Error).stack,
      );
    }
  }

  /**
   * Check for auctions that need to end.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkAuctionsToEnd(): Promise<void> {
    try {
      const auctions = await this.auctionService.findAuctionsToEnd();
      for (const auction of auctions) {
        await this.auctionQueue.add(
          AuctionJobName.END_AUCTION,
          { auctionId: auction.id },
          {
            jobId: `end-auction-${auction.id}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
          },
        );
        this.logger.debug(`Scheduled end for auction ${auction.id}`);
      }
    } catch (error) {
      this.logger.error(
        'Error checking auctions to end',
        (error as Error).stack,
      );
    }
  }
}
