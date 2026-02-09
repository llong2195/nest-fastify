import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DateAudit } from '@/common/base/date_audit.entity';

import { AuctionEntity } from './auction.entity';

export enum BidStatus {
  VALID = 'valid',
  OUTBID = 'outbid',
  WINNER = 'winner',
  INVALID = 'invalid',
}

@Index('idx_bid_auction_id', ['auctionId'])
@Index('idx_bid_bidder_id', ['bidderId'])
@Index('idx_bid_auction_amount', ['auctionId', 'amount'])
@Entity({ name: 'bid' })
export class BidEntity extends DateAudit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'auction_id', type: 'bigint' })
  auctionId: number;

  @Column({ name: 'bidder_id', type: 'bigint' })
  bidderId: number;

  @Column({ name: 'amount', type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.VALID,
  })
  status: BidStatus;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  idempotencyKey: string;

  @ManyToOne(() => AuctionEntity, (auction) => auction.bids)
  @JoinColumn({ name: 'auction_id' })
  auction: AuctionEntity;

  constructor(partial: Partial<BidEntity>) {
    super();
    Object.assign(this, partial);
  }
}
