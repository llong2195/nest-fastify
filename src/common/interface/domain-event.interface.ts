import { KafkaTopic } from '@/common/enums/auction.enum';

/**
 * Base domain event schema for all Kafka events.
 * All events follow this envelope to enable idempotent consumers.
 */
export interface DomainEvent<T = Record<string, unknown>> {
  /** Unique event ID (UUID v4). Used for idempotency checks. */
  eventId: string;
  /** Event type name, matches the Kafka topic. */
  eventType: KafkaTopic;
  /** Schema version for forward/backward compatibility. */
  version: number;
  /** ISO-8601 timestamp of when the event was produced. */
  timestamp: string;
  /** The auction this event belongs to. Used as partition key. */
  auctionId: number;
  /** The actual event payload. */
  payload: T;
}

/* ───────────────── Payload types ───────────────── */

export interface AuctionCreatedPayload {
  title: string;
  description: string;
  startingPrice: number;
  minBidIncrement: number;
  startTime: string;
  endTime: string;
  sellerId: number;
  category?: string;
  imageUrl?: string;
}

export interface AuctionStartedPayload {
  startTime: string;
  currentPrice: number;
}

export interface AuctionEndedPayload {
  endTime: string;
  finalPrice: number;
  totalBids: number;
  winnerId: number | null;
}

export interface AuctionCancelledPayload {
  reason: string;
  cancelledBy: number;
}

export interface BidPlacedPayload {
  bidId: number;
  bidderId: number;
  amount: number;
  previousPrice: number;
  totalBids: number;
}

export interface BidOutbidPayload {
  outbidBidderId: number;
  outbidBidId: number;
  newBidId: number;
  newBidderId: number;
  newAmount: number;
}

export interface AuctionWinnerSelectedPayload {
  winnerId: number;
  winningBidId: number;
  finalPrice: number;
}
