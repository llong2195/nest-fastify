import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Outbox table for the Transactional Outbox Pattern.
 * Domain events are written here within the same transaction as the business data.
 * A relay process reads unpublished rows and emits them to Kafka.
 */
@Index('idx_outbox_published', ['published'])
@Entity({ name: 'outbox_event' })
export class OutboxEventEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 100 })
  aggregateId: string;

  @Column({ name: 'topic', type: 'varchar', length: 255 })
  topic: string;

  @Column({ name: 'partition_key', type: 'varchar', length: 255 })
  partitionKey: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'published', type: 'boolean', default: false })
  published: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date;

  constructor(partial: Partial<OutboxEventEntity>) {
    Object.assign(this, partial);
  }
}
