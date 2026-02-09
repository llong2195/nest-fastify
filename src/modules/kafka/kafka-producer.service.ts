import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel as KafkaLogLevel } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private producer: Producer;
  private readonly kafka: Kafka;
  private readonly logger = new Logger(KafkaProducerService.name);
  private isConnected = false;

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

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      idempotent: true,
      maxInFlightRequests: 5,
      transactionalId: undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error(
        'Failed to connect Kafka producer — will retry on next send',
        (error as Error).stack,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.isConnected) return;
    this.logger.log('Disconnecting Kafka producer...');
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(
        'Error disconnecting Kafka producer',
        (error as Error).stack,
      );
    }
  }

  /**
   * Send a single message to a Kafka topic.
   * @param topic   Kafka topic name
   * @param key     Partition key (auctionId) to preserve ordering
   * @param value   Serialized event payload (JSON string)
   * @param headers Optional Kafka headers
   */
  async send(
    topic: string,
    key: string,
    value: string,
    headers?: Record<string, string>,
  ): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value,
            headers,
          },
        ],
      });
      this.logger.log(`Event sent to topic=${topic} key=${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to send event to topic=${topic} key=${key}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Send multiple messages to a topic in a single batch.
   */
  async sendBatch(
    topic: string,
    messages: Array<{
      key: string;
      value: string;
      headers?: Record<string, string>;
    }>,
  ): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages,
      });
      this.logger.log(
        `Batch of ${messages.length} events sent to topic=${topic}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send batch to topic=${topic}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
