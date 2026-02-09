import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaTopic } from '@/common/enums/auction.enum';
import { KafkaConsumerService } from '@/modules/kafka/kafka-consumer.service';
import { DomainEvent } from '@/common/interface/domain-event.interface';
import { RedisService } from '@/common/shared/redis.service';

const IDEMPOTENCY_TTL = 86400; // 24 hours
const IDEMPOTENCY_PREFIX = 'notification:event:';

/**
 * Notification consumer that listens to Kafka events and triggers
 * notifications (email, push) to relevant users.
 *
 * Consumers are idempotent — duplicate events are handled gracefully
 * via Redis-based deduplication with TTL.
 */
@Injectable()
export class NotificationConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.startConsumer();
    this.logger.log('Notification consumer initialized');
  }

  private async startConsumer(): Promise<void> {
    await this.kafkaConsumer.consume(
      {
        groupId: 'auction-notification-consumer',
        topics: [
          KafkaTopic.BID_OUTBID,
          KafkaTopic.AUCTION_ENDED,
          KafkaTopic.AUCTION_WINNER_SELECTED,
          KafkaTopic.AUCTION_CANCELLED,
        ],
      },
      async ({ topic, message }) => {
        if (!message.value) return;

        const event: DomainEvent = JSON.parse(message.value.toString());

        // Redis-based idempotency check
        const redisKey = `${IDEMPOTENCY_PREFIX}${event.eventId}`;
        const alreadyProcessed = await this.redisService.get(redisKey);
        if (alreadyProcessed) {
          this.logger.debug(
            `Skipping duplicate notification event: ${event.eventId}`,
          );
          return;
        }
        await this.redisService.set(redisKey, '1', IDEMPOTENCY_TTL);

        await this.handleEvent(topic, event);
      },
    );
  }

  private async handleEvent(topic: string, event: DomainEvent): Promise<void> {
    switch (topic) {
      case KafkaTopic.BID_OUTBID:
        await this.handleBidOutbid(event);
        break;
      case KafkaTopic.AUCTION_ENDED:
        await this.handleAuctionEnded(event);
        break;
      case KafkaTopic.AUCTION_WINNER_SELECTED:
        await this.handleWinnerSelected(event);
        break;
      case KafkaTopic.AUCTION_CANCELLED:
        await this.handleAuctionCancelled(event);
        break;
      default:
        this.logger.warn(`Unhandled notification topic: ${topic}`);
    }
  }

  private async handleBidOutbid(event: DomainEvent): Promise<void> {
    const { outbidBidderId, newAmount } = event.payload as Record<
      string,
      unknown
    >;
    this.logger.log(
      `Notification: User ${outbidBidderId} was outbid on auction ${event.auctionId}. ` +
        `New highest bid: ${newAmount}`,
    );
    // TODO: Integrate with NodemailerModule to send email
    // TODO: Integrate with push notification service
  }

  private async handleAuctionEnded(event: DomainEvent): Promise<void> {
    this.logger.log(
      `Notification: Auction ${event.auctionId} has ended. ` +
        `Final price: ${(event.payload as Record<string, unknown>).finalPrice}`,
    );
    // TODO: Notify all bidders that the auction has ended
  }

  private async handleWinnerSelected(event: DomainEvent): Promise<void> {
    const { winnerId, finalPrice } = event.payload as Record<string, unknown>;
    this.logger.log(
      `Notification: User ${winnerId} won auction ${event.auctionId} ` +
        `with bid of ${finalPrice}`,
    );
    // TODO: Send congratulations email to winner
    // TODO: Send payment instructions
  }

  private async handleAuctionCancelled(event: DomainEvent): Promise<void> {
    const { reason } = event.payload as Record<string, unknown>;
    this.logger.log(
      `Notification: Auction ${event.auctionId} cancelled. Reason: ${reason}`,
    );
    // TODO: Notify all bidders about cancellation
  }
}
