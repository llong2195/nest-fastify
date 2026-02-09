import { Module } from '@nestjs/common';

import { KafkaModule } from '@/modules/kafka/kafka.module';

import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [KafkaModule],
  providers: [AuditConsumer],
  exports: [AuditConsumer],
})
export class AuditModule {}
