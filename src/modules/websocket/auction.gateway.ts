import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway as WsGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { KafkaTopic } from '@/common/enums/auction.enum';
import { KafkaConsumerService } from '@/modules/kafka/kafka-consumer.service';
import { DomainEvent } from '@/common/interface/domain-event.interface';
import { RedisService } from '@/common/shared/redis.service';

const IDEMPOTENCY_TTL = 3600; // 1 hour for WS events
const IDEMPOTENCY_PREFIX = 'ws:event:';

/**
 * WebSocket Gateway that consumes Kafka events and broadcasts
 * realtime updates to connected clients.
 *
 * Clients join auction-specific rooms to receive targeted events.
 * Room format: `auction:{auctionId}`
 */
@WsGateway({
  cors: { origin: '*' },
  namespace: '/auction',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class AuctionGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuctionGateway.name);

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.startKafkaConsumer();
    this.logger.log('Auction WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins an auction room to receive targeted events.
   */
  @SubscribeMessage('joinAuction')
  handleJoinAuction(
    @MessageBody() data: { auctionId: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `auction:${data.auctionId}`;
    void client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
    client.emit('joinedAuction', { auctionId: data.auctionId, room });
  }

  /**
   * Client leaves an auction room.
   */
  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(
    @MessageBody() data: { auctionId: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `auction:${data.auctionId}`;
    void client.leave(room);
    this.logger.debug(`Client ${client.id} left room ${room}`);
    client.emit('leftAuction', { auctionId: data.auctionId, room });
  }

  /**
   * Start consuming Kafka events for WebSocket broadcasting.
   */
  private async startKafkaConsumer(): Promise<void> {
    await this.kafkaConsumer.consume(
      {
        groupId: 'auction-ws-gateway',
        topics: [
          KafkaTopic.BID_PLACED,
          KafkaTopic.BID_OUTBID,
          KafkaTopic.AUCTION_STARTED,
          KafkaTopic.AUCTION_ENDED,
          KafkaTopic.AUCTION_WINNER_SELECTED,
          KafkaTopic.AUCTION_CREATED,
          KafkaTopic.AUCTION_CANCELLED,
        ],
      },
      async ({ topic, message }) => {
        if (!message.value) return;

        const event: DomainEvent = JSON.parse(message.value.toString());

        // Redis-based idempotency: skip already-processed events
        const redisKey = `${IDEMPOTENCY_PREFIX}${event.eventId}`;
        const alreadyProcessed = await this.redisService.get(redisKey);
        if (alreadyProcessed) {
          this.logger.debug(`Skipping duplicate event: ${event.eventId}`);
          return;
        }
        await this.redisService.set(redisKey, '1', IDEMPOTENCY_TTL);
        await this.broadcastEvent(topic, event);
      },
    );
  }

  /**
   * Broadcast a domain event to the appropriate auction room.
   */
  private async broadcastEvent(
    topic: string,
    event: DomainEvent,
  ): Promise<void> {
    const room = `auction:${event.auctionId}`;

    // Emit to the specific auction room
    this.server.to(room).emit(topic, {
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      auctionId: event.auctionId,
      payload: event.payload,
    });

    // Also emit to a global feed for listing pages
    this.server.emit('auction:update', {
      eventType: event.eventType,
      auctionId: event.auctionId,
      timestamp: event.timestamp,
      payload: event.payload,
    });

    this.logger.debug(
      `Broadcast event=${topic} to room=${room} eventId=${event.eventId}`,
    );
  }
}
