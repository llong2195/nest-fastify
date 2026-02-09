import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaProducerService } from './kafka-producer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}
