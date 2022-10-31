import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueProcessor } from './queue.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'default',
    }),
  ],
  controllers: [QueueController],
  providers: [QueueProcessor, QueueService],
})
export class QueueModule {}
