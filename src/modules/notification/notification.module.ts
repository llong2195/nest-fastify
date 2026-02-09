import { Module } from '@nestjs/common';

import { KafkaModule } from '@/modules/kafka/kafka.module';

import { NotificationConsumer } from './notification.consumer';

@Module({
  imports: [KafkaModule],
  providers: [NotificationConsumer],
  exports: [NotificationConsumer],
})
export class NotificationModule {}
