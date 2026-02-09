import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { AuctionJobName, AuctionQueueName } from '@/common/enums/auction.enum';

import { BidService } from '../services/bid.service';
import { PlaceBidDto } from '../dto/auction.dto';

interface PlaceBidJobData extends PlaceBidDto {
  bidderId: number;
}

@Processor(AuctionQueueName.BID_PROCESSING, {
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 1000,
  },
})
export class BidProcessor extends WorkerHost {
  private readonly logger = new Logger(BidProcessor.name);

  constructor(private readonly bidService: BidService) {
    super();
  }

  async process(job: Job<PlaceBidJobData>): Promise<void> {
    const { name, data, id } = job;
    this.logger.log(
      `Processing job=${name} id=${id} auctionId=${data.auctionId}`,
    );

    switch (name) {
      case AuctionJobName.PLACE_BID:
        await this.handlePlaceBid(job);
        break;
      default:
        this.logger.warn(`Unknown job name: ${name}`);
    }
  }

  private async handlePlaceBid(job: Job<PlaceBidJobData>): Promise<void> {
    const { data } = job;

    try {
      const bid = await this.bidService.placeBid(
        {
          auctionId: data.auctionId,
          amount: data.amount,
          idempotencyKey: data.idempotencyKey,
        },
        data.bidderId,
      );

      this.logger.log(
        `Bid placed successfully: bidId=${bid.id} auctionId=${data.auctionId} ` +
          `amount=${data.amount} bidderId=${data.bidderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to place bid: auctionId=${data.auctionId} bidderId=${data.bidderId}`,
        (error as Error).stack,
      );
      throw error; // Let BullMQ retry
    }
  }
}
