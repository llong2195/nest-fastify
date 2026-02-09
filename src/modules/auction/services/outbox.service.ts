import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThan, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { KafkaTopic } from '@/common/enums/auction.enum';
import { OutboxEventEntity } from '@/database/pg/entities/entities/outbox-event.entity';
import { DomainEvent } from '@/common/interface/domain-event.interface';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepository: Repository<OutboxEventEntity>,
  ) {}

  /**
   * Write a domain event into the outbox table within a transaction.
   * This must be called inside the same transaction as the business data change.
   */
  async writeEvent<T>(
    manager: EntityManager,
    topic: KafkaTopic,
    auctionId: number,
    payload: T,
    version = 1,
  ): Promise<OutboxEventEntity> {
    const eventId = randomUUID();
    const event = new OutboxEventEntity({
      eventId,
      eventType: topic,
      aggregateType: 'auction',
      aggregateId: String(auctionId),
      topic,
      partitionKey: String(auctionId),
      payload: this.buildEventEnvelope(
        eventId,
        topic,
        auctionId,
        payload as Record<string, unknown>,
        version,
      ) as unknown as Record<string, unknown>,
      version,
      published: false,
    });

    const saved = await manager.save(OutboxEventEntity, event);
    this.logger.debug(
      `Outbox event written: eventId=${eventId} type=${topic} auctionId=${auctionId}`,
    );
    return saved;
  }

  /**
   * Fetch unpublished events (used by the outbox relay worker).
   */
  async getUnpublishedEvents(batchSize = 100): Promise<OutboxEventEntity[]> {
    return this.outboxRepository.find({
      where: { published: false },
      order: { createdAt: 'ASC' },
      take: batchSize,
    });
  }

  /**
   * Mark events as published after successful Kafka send.
   */
  async markAsPublished(eventIds: number[]): Promise<void> {
    if (eventIds.length === 0) return;
    await this.outboxRepository
      .createQueryBuilder()
      .update(OutboxEventEntity)
      .set({ published: true, publishedAt: new Date() })
      .whereInIds(eventIds)
      .execute();
  }

  /**
   * Clean up old published events (retention policy).
   */
  async cleanupOldEvents(retentionDays = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.outboxRepository.delete({
      published: true,
      publishedAt: LessThan(cutoff),
    });

    return result.affected ?? 0;
  }

  private buildEventEnvelope<T>(
    eventId: string,
    eventType: KafkaTopic,
    auctionId: number,
    payload: T,
    version: number,
  ): DomainEvent<T> {
    return {
      eventId,
      eventType,
      version,
      timestamp: new Date().toISOString(),
      auctionId,
      payload,
    };
  }
}
