import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { AuctionJobName, AuctionQueueName } from '@/common/enums/auction.enum';

import { AuctionService } from '../services/auction.service';

interface AuctionJobData {
  auctionId: number;
}

@Processor(AuctionQueueName.AUCTION_PROCESSING, {
  concurrency: 3,
})
export class AuctionProcessor extends WorkerHost {
  private readonly logger = new Logger(AuctionProcessor.name);

  constructor(private readonly auctionService: AuctionService) {
    super();
  }

  async process(job: Job<AuctionJobData>): Promise<void> {
    const { name, data, id } = job;
    this.logger.log(
      `Processing job=${name} id=${id} auctionId=${data.auctionId}`,
    );

    switch (name) {
      case AuctionJobName.START_AUCTION:
        await this.handleStartAuction(data.auctionId);
        break;
      case AuctionJobName.END_AUCTION:
        await this.handleEndAuction(data.auctionId);
        break;
      case AuctionJobName.CANCEL_AUCTION:
        // Cancel is handled synchronously in the controller
        this.logger.log(`Auction ${data.auctionId} cancellation processed`);
        break;
      default:
        this.logger.warn(`Unknown job name: ${name}`);
    }
  }

  private async handleStartAuction(auctionId: number): Promise<void> {
    try {
      await this.auctionService.startAuction(auctionId);
      this.logger.log(`Auction ${auctionId} started successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to start auction ${auctionId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async handleEndAuction(auctionId: number): Promise<void> {
    try {
      await this.auctionService.endAuction(auctionId);
      this.logger.log(`Auction ${auctionId} ended successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to end auction ${auctionId}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
