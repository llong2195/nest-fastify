/**
 * Kafka topics for the auction domain.
 */
export enum KafkaTopic {
  AUCTION_CREATED = 'auction.created',
  AUCTION_STARTED = 'auction.started',
  AUCTION_ENDED = 'auction.ended',
  AUCTION_CANCELLED = 'auction.cancelled',
  AUCTION_WINNER_SELECTED = 'auction.winner_selected',
  BID_PLACED = 'bid.placed',
  BID_OUTBID = 'bid.outbid',
}

/**
 * BullMQ queue names for auction processing.
 */
export enum AuctionQueueName {
  AUCTION_PROCESSING = 'AUCTION_PROCESSING',
  BID_PROCESSING = 'BID_PROCESSING',
  AUCTION_SCHEDULER = 'AUCTION_SCHEDULER',
  OUTBOX_RELAY = 'OUTBOX_RELAY',
}

/**
 * BullMQ job names.
 */
export enum AuctionJobName {
  CREATE_AUCTION = 'create-auction',
  START_AUCTION = 'start-auction',
  END_AUCTION = 'end-auction',
  CANCEL_AUCTION = 'cancel-auction',
  PLACE_BID = 'place-bid',
  SELECT_WINNER = 'select-winner',
  PROCESS_OUTBOX = 'process-outbox',
  SCHEDULE_AUCTION_START = 'schedule-auction-start',
  SCHEDULE_AUCTION_END = 'schedule-auction-end',
}
