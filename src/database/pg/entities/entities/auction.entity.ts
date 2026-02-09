import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DateAudit } from '@/common/base/date_audit.entity';

import { BidEntity } from './bid.entity';

export enum AuctionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

@Index('idx_auction_status', ['status'])
@Index('idx_auction_end_time', ['endTime'])
@Entity({ name: 'auction' })
export class AuctionEntity extends DateAudit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'starting_price', type: 'decimal', precision: 15, scale: 2 })
  startingPrice: number;

  @Column({
    name: 'current_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  currentPrice: number;

  @Column({
    name: 'min_bid_increment',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 1,
  })
  minBidIncrement: number;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AuctionStatus,
    default: AuctionStatus.SCHEDULED,
  })
  status: AuctionStatus;

  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId: number;

  @Column({ name: 'winner_id', type: 'bigint', nullable: true })
  winnerId: number;

  @Column({ name: 'winning_bid_id', type: 'bigint', nullable: true })
  winningBidId: number;

  @Column({ name: 'total_bids', type: 'int', default: 0 })
  totalBids: number;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category: string;

  @OneToMany(() => BidEntity, (bid) => bid.auction)
  bids: BidEntity[];

  constructor(partial: Partial<AuctionEntity>) {
    super();
    Object.assign(this, partial);
  }
}
