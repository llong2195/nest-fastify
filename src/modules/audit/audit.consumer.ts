import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaTopic } from '@/common/enums/auction.enum';
import { KafkaConsumerService } from '@/modules/kafka/kafka-consumer.service';
import { DomainEvent } from '@/common/interface/domain-event.interface';
import { RedisService } from '@/common/shared/redis.service';

const IDEMPOTENCY_TTL = 86400; // 24 hours
const IDEMPOTENCY_PREFIX = 'audit:event:';

/**
 * Audit/Logging consumer that persists all domain events
 * for compliance, debugging, and analytics purposes.
 *
 * Consumes ALL auction topics.
 * Idempotent: duplicate events are deduplicated via Redis with TTL.
 */
@Injectable()
export class AuditConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.startConsumer();
    this.logger.log('Audit consumer initialized');
  }

  private async startConsumer(): Promise<void> {
    await this.kafkaConsumer.consume(
      {
        groupId: 'auction-audit-consumer',
        topics: [
          KafkaTopic.AUCTION_CREATED,
          KafkaTopic.AUCTION_STARTED,
          KafkaTopic.AUCTION_ENDED,
          KafkaTopic.AUCTION_CANCELLED,
          KafkaTopic.AUCTION_WINNER_SELECTED,
          KafkaTopic.BID_PLACED,
          KafkaTopic.BID_OUTBID,
        ],
        fromBeginning: true,
      },
      async ({ topic, partition, message }) => {
        if (!message.value) return;

        const event: DomainEvent = JSON.parse(message.value.toString());

        // Redis-based idempotency check
        const redisKey = `${IDEMPOTENCY_PREFIX}${event.eventId}`;
        const alreadyProcessed = await this.redisService.get(redisKey);
        if (alreadyProcessed) {
          return;
        }
        await this.redisService.set(redisKey, '1', IDEMPOTENCY_TTL);

        await this.persistAuditLog(topic, partition, event, message.offset);
      },
    );
  }

  private async persistAuditLog(
    topic: string,
    partition: number,
    event: DomainEvent,
    offset: string,
  ): Promise<void> {
    // Structured audit log entry
    const auditEntry = {
      eventId: event.eventId,
      eventType: event.eventType,
      version: event.version,
      timestamp: event.timestamp,
      auctionId: event.auctionId,
      topic,
      partition,
      offset,
      payload: event.payload,
    };

    this.logger.log(`AUDIT: ${JSON.stringify(auditEntry)}`);

    // TODO: Persist to a dedicated audit_log table or external store (Elasticsearch, S3)
    // await this.auditRepository.save(auditEntry);
  }
}
