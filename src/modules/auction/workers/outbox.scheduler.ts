import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { AuctionJobName, AuctionQueueName } from '@/common/enums/auction.enum';

import { OutboxService } from '../services/outbox.service';

/**
 * Schedules outbox relay processing and cleanup.
 */
@Injectable()
export class OutboxScheduler {
  private readonly logger = new Logger(OutboxScheduler.name);

  constructor(
    @InjectQueue(AuctionQueueName.OUTBOX_RELAY)
    private readonly outboxQueue: Queue,
    private readonly outboxService: OutboxService,
  ) {}

  /**
   * Trigger outbox relay every 2 seconds for near-realtime event delivery.
   */
  @Cron('*/2 * * * * *')
  async triggerOutboxRelay(): Promise<void> {
    try {
      await this.outboxQueue.add(
        AuctionJobName.PROCESS_OUTBOX,
        {},
        {
          jobId: `outbox-relay-${Date.now()}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 500 },
          removeOnComplete: { count: 50 },
          removeOnFail: { count: 200 },
        },
      );
    } catch (error) {
      this.logger.error(
        'Error scheduling outbox relay',
        (error as Error).stack,
      );
    }
  }

  /**
   * Clean up old published outbox events daily.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOutbox(): Promise<void> {
    try {
      const deleted = await this.outboxService.cleanupOldEvents(7);
      this.logger.log(`Cleaned up ${deleted} old outbox events`);
    } catch (error) {
      this.logger.error(
        'Error cleaning up outbox events',
        (error as Error).stack,
      );
    }
  }
}
