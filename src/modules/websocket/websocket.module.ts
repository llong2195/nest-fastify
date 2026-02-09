import { Module } from '@nestjs/common';

import { KafkaModule } from '@/modules/kafka/kafka.module';

import { AuctionGateway } from './auction.gateway';

@Module({
  imports: [KafkaModule],
  providers: [AuctionGateway],
  exports: [AuctionGateway],
})
export class WebsocketModule {}
