import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { AuctionJobName, AuctionQueueName } from '@/common/enums/auction.enum';

import { OutboxService } from '../services/outbox.service';
import { KafkaProducerService } from '@/modules/kafka/kafka-producer.service';

/**
 * Outbox Relay Worker.
 * Polls the outbox table for unpublished events and sends them to Kafka.
 * This ensures at-least-once delivery with the Transactional Outbox Pattern.
 */
@Processor(AuctionQueueName.OUTBOX_RELAY, {
  concurrency: 1, // Single concurrency to maintain ordering
})
export class OutboxRelayProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxRelayProcessor.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { name, id } = job;
    this.logger.debug(`Processing outbox relay job=${name} id=${id}`);

    switch (name) {
      case AuctionJobName.PROCESS_OUTBOX:
        await this.relayOutboxEvents();
        break;
      default:
        this.logger.warn(`Unknown job name: ${name}`);
    }
  }

  private async relayOutboxEvents(): Promise<void> {
    const events = await this.outboxService.getUnpublishedEvents(50);

    if (events.length === 0) {
      return;
    }

    this.logger.log(`Relaying ${events.length} outbox events to Kafka`);

    const publishedIds: number[] = [];

    for (const event of events) {
      try {
        await this.kafkaProducer.send(
          event.topic,
          event.partitionKey,
          JSON.stringify(event.payload),
          {
            eventId: event.eventId,
            eventType: event.eventType,
            version: String(event.version),
          },
        );
        publishedIds.push(event.id);
      } catch (error) {
        this.logger.error(
          `Failed to relay outbox event id=${event.id} eventId=${event.eventId}`,
          (error as Error).stack,
        );
        // Stop processing on first failure to maintain ordering
        break;
      }
    }

    if (publishedIds.length > 0) {
      await this.outboxService.markAsPublished(publishedIds);
      this.logger.log(
        `Marked ${publishedIds.length} outbox events as published`,
      );
    }
  }
}
