import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { AuctionEntity } from '@/database/pg/entities/entities/auction.entity';
import { BidEntity } from '@/database/pg/entities/entities/bid.entity';
import { OutboxEventEntity } from '@/database/pg/entities/entities/outbox-event.entity';
import { AuctionQueueName } from '@/common/enums/auction.enum';
import { LoggerModule } from '@/common/logger/logger.module';

import { AuctionController } from './controllers/auction.controller';
import { AuctionService } from './services/auction.service';
import { BidService } from './services/bid.service';
import { OutboxService } from './services/outbox.service';
import { AuctionProcessor } from './workers/auction.processor';
import { AuctionScheduler } from './workers/auction.scheduler';
import { BidProcessor } from './workers/bid.processor';
import { OutboxRelayProcessor } from './workers/outbox-relay.processor';
import { OutboxScheduler } from './workers/outbox.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuctionEntity, BidEntity, OutboxEventEntity]),

    // Register queues only — BullModule.forRootAsync() is already configured globally in QueueModule
    BullModule.registerQueue(
      { name: AuctionQueueName.AUCTION_PROCESSING },
      { name: AuctionQueueName.BID_PROCESSING },
      { name: AuctionQueueName.AUCTION_SCHEDULER },
      { name: AuctionQueueName.OUTBOX_RELAY },
    ),

    LoggerModule,
  ],
  controllers: [AuctionController],
  providers: [
    // Services
    AuctionService,
    BidService,
    OutboxService,

    // Workers
    AuctionProcessor,
    BidProcessor,
    OutboxRelayProcessor,

    // Schedulers
    AuctionScheduler,
    OutboxScheduler,
  ],
  exports: [AuctionService, BidService, OutboxService],
})
export class AuctionModule {}
