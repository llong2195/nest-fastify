import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuctionGateway } from '../gateway/auction.gateway';

@Controller()
export class BidProcessor {
  private readonly logger = new Logger(BidProcessor.name);

  constructor(private readonly auctionGateway: AuctionGateway) {}

  @EventPattern('auction.bid.place')
  async handleBidPlaced(@Payload() data: any) {
    this.logger.log(`Processing bid: ${JSON.stringify(data)}`);

    // Logic:
    // 1. Validate bid (check DB)
    // 2. Update DB
    // 3. Publish result to Redis (to broadcast back to WS)

    // For now, simulate processing and log
    this.logger.log(`Bid valid. Updating state...`);

    // Broadcast to room
    this.auctionGateway.server.to(data.auctionId).emit('bidAccepted', data);
  }
}
