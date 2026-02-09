import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Consumer,
  EachMessagePayload,
  Kafka,
  logLevel as KafkaLogLevel,
} from 'kafkajs';

export interface KafkaConsumerConfig {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
}

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly consumers: Consumer[] = [];
  private readonly kafka: Kafka;
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId:
        this.configService.get<string>('KAFKA_CLIENT_ID') || 'auction-api',
      brokers: (
        this.configService.get<string>('KAFKA_BROKERS') || 'localhost:9092'
      ).split(','),
      logLevel: KafkaLogLevel.WARN,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });
  }

  onModuleInit(): void {
    this.logger.log('Kafka consumer service initialized');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting all Kafka consumers...');
    for (const consumer of this.consumers) {
      try {
        await consumer.disconnect();
      } catch (error) {
        this.logger.error(
          'Error disconnecting consumer',
          (error as Error).stack,
        );
      }
    }
    this.logger.log('All Kafka consumers disconnected');
  }

  /**
   * Create a consumer, subscribe to topics, and start processing.
   * Each consumer group gets its own Consumer instance.
   */
  async consume(
    config: KafkaConsumerConfig,
    handler: MessageHandler,
  ): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: config.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });

    await consumer.connect();
    this.logger.log(`Consumer connected for group=${config.groupId}`);

    for (const topic of config.topics) {
      await consumer.subscribe({
        topic,
        fromBeginning: config.fromBeginning ?? false,
      });
      this.logger.log(
        `Consumer group=${config.groupId} subscribed to topic=${topic}`,
      );
    }

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;
        this.logger.debug(
          `Received message topic=${topic} partition=${partition} offset=${message.offset}`,
        );
        try {
          await handler(payload);
        } catch (error) {
          this.logger.error(
            `Error processing message topic=${topic} partition=${partition} offset=${message.offset}`,
            (error as Error).stack,
          );
          // At-least-once: don't commit offset on failure → message will be redelivered
          throw error;
        }
      },
    });

    this.consumers.push(consumer);
  }
}
