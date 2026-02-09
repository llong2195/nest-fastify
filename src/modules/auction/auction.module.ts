import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuctionGateway } from './gateway/auction.gateway';
import { BidProcessor } from './processors/bid.processor';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUCTION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auction',
              brokers: [
                configService.get<string>('KAFKA_BROKER') || 'localhost:9092',
              ],
            },
            consumer: {
              groupId: 'auction-consumer',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [AuctionGateway],
  controllers: [BidProcessor],
})
export class AuctionModule {}
