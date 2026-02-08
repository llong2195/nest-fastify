import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RateLimiter } from './rate-limiter';
import { RedisSessionManager } from './redis-session.manager';

/**
 * High-Load Socket.io Gateway with Redis-backed Session
 *
 * Key Features for Multi-Instance Scaling:
 *
 * 1. REDIS ADAPTER: Cross-server event broadcasting via Redis pub/sub
 * 2. REDIS SESSION: User-socket mappings stored in Redis (shared across instances)
 * 3. RATE LIMITER: Token bucket algorithm prevents event flooding
 *
 * Multi-Instance Communication Flow:
 * ┌──────────────┐                         ┌──────────────┐
 * │  Server 1    │                         │  Server 2    │
 * │  User A      │                         │  User B      │
 * └──────┬───────┘                         └──────┬───────┘
 *        │                                        │
 *        │  1. User A sends DM to User B          │
 *        │                                        │
 *        ▼                                        │
 * ┌─────────────────────────────────────────────────────────┐
 * │                     Redis                                │
 * │  - Session: user:sockets:B → [socketId on Server 2]     │
 * │  - PubSub: Broadcast DM event to all servers            │
 * └─────────────────────────────────────────────────────────┘
 *        │                                        │
 *        │  2. Server 2 receives event via Redis  │
 *        │     and delivers to User B             │
 *        │                                        ▼
 *        │                                 [User B receives DM]
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(RedisSessionManager)
    private readonly sessionManager: RedisSessionManager,
    @Inject(RateLimiter) private readonly rateLimiter: RateLimiter,
  ) {}

  afterInit(_server: Server): void {
    this.logger.log(
      `WebSocket Gateway initialized (instance: ${this.sessionManager.getInstanceId()})`,
    );
  }

  /**
   * Handle new connection
   */
  async handleConnection(client: Socket): Promise<void> {
    const userId = (client.handshake.auth?.userId as string) || client.id;

    // Register in Redis (shared across all instances)
    await this.sessionManager.registerUser(userId, client);

    this.logger.log(
      `User ${userId} connected (socket: ${client.id}, instance: ${this.sessionManager.getInstanceId()})`,
    );
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = await this.sessionManager.unregisterSocket(client.id);
    this.rateLimiter.cleanup(client.id);

    if (userId) {
      // Check if user still online (may have other connections on other instances)
      const stillOnline = await this.sessionManager.isUserOnline(userId);

      if (!stillOnline) {
        // User completely offline - notify rooms
        const rooms = await this.sessionManager.getUserRooms(userId);
        for (const room of rooms) {
          this.server.to(room).emit('user_offline', { userId, room });
          await this.sessionManager.removeUserFromRoom(userId, room);
        }
      }
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  // ==================== Health Check ====================

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): {
    event: string;
    data: string;
  } {
    if (!this.rateLimiter.isAllowed(client.id, 'ping')) {
      return { event: 'error', data: 'Rate limit exceeded' };
    }
    return { event: 'pong', data: 'pong' };
  }

  // ==================== Room Management ====================

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ): Promise<{ event: string; data: { success: boolean; room: string } }> {
    if (!this.rateLimiter.isAllowed(client.id, 'join_room')) {
      return { event: 'error', data: { success: false, room: payload.room } };
    }

    const userId =
      (await this.sessionManager.getUserBySocket(client.id)) || client.id;

    // Join Socket.io room (handled by Redis adapter across instances)
    await client.join(payload.room);

    // Track membership in Redis
    await this.sessionManager.addUserToRoom(userId, payload.room);

    // Notify all members (Redis adapter broadcasts to all instances)
    this.server.to(payload.room).emit('user_joined', {
      userId,
      room: payload.room,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User ${userId} joined room ${payload.room}`);
    return {
      event: 'room_joined',
      data: { success: true, room: payload.room },
    };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ): Promise<{ event: string; data: { success: boolean; room: string } }> {
    const userId =
      (await this.sessionManager.getUserBySocket(client.id)) || client.id;

    await client.leave(payload.room);
    await this.sessionManager.removeUserFromRoom(userId, payload.room);

    this.server.to(payload.room).emit('user_left', {
      userId,
      room: payload.room,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User ${userId} left room ${payload.room}`);
    return { event: 'room_left', data: { success: true, room: payload.room } };
  }

  @SubscribeMessage('get_room_members')
  async handleGetRoomMembers(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { room: string },
  ): Promise<{ event: string; data: { room: string; members: string[] } }> {
    // Gets members from Redis (all instances see the same data)
    const members = await this.sessionManager.getRoomMembers(payload.room);
    return { event: 'room_members', data: { room: payload.room, members } };
  }

  // ==================== Messaging ====================

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; message: string; type?: string },
  ): Promise<{ event: string; data: { success: boolean } }> {
    if (!this.rateLimiter.isAllowed(client.id, 'send_message')) {
      return { event: 'error', data: { success: false } };
    }

    const userId =
      (await this.sessionManager.getUserBySocket(client.id)) || client.id;

    // Broadcast to room (Redis adapter handles cross-server delivery)
    this.server.to(payload.room).emit('new_message', {
      from: userId,
      room: payload.room,
      message: payload.message,
      type: payload.type || 'text',
      timestamp: new Date().toISOString(),
    });

    return { event: 'message_sent', data: { success: true } };
  }

  /**
   * Direct message to a specific user (WORKS ACROSS INSTANCES)
   *
   * Flow:
   * 1. Look up target user's sockets in Redis (shared across all instances)
   * 2. Emit event to those socket IDs
   * 3. Redis adapter broadcasts to all servers
   * 4. Only the server that owns the socket delivers the message
   */
  @SubscribeMessage('direct_message')
  async handleDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { toUserId: string; message: string },
  ): Promise<{
    event: string;
    data: { success: boolean; delivered: boolean };
  }> {
    if (!this.rateLimiter.isAllowed(client.id, 'send_message')) {
      return { event: 'error', data: { success: false, delivered: false } };
    }

    const fromUserId =
      (await this.sessionManager.getUserBySocket(client.id)) || client.id;

    // Get ALL sockets for target user from Redis (across all instances)
    const targetSockets = await this.sessionManager.getUserSockets(
      payload.toUserId,
    );

    if (targetSockets.length === 0) {
      // User is offline
      return { event: 'dm_sent', data: { success: true, delivered: false } };
    }

    // Emit to all target sockets (Redis adapter routes to correct instances)
    const message = {
      from: fromUserId,
      message: payload.message,
      timestamp: new Date().toISOString(),
    };

    for (const socketId of targetSockets) {
      this.server.to(socketId).emit('direct_message', message);
    }

    return { event: 'dm_sent', data: { success: true, delivered: true } };
  }

  // ==================== Presence ====================

  @SubscribeMessage('update_status')
  async handleUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { status: string },
  ): Promise<void> {
    const userId =
      (await this.sessionManager.getUserBySocket(client.id)) || client.id;
    const rooms = await this.sessionManager.getUserRooms(userId);

    for (const room of rooms) {
      this.server.to(room).emit('user_status_changed', {
        userId,
        status: payload.status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_online_users')
  async handleGetOnlineUsers(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { page?: number; limit?: number },
  ): Promise<{
    event: string;
    data: { users: string[]; total: number; page: number };
  }> {
    // Gets from Redis (all online users across all instances)
    const allUsers = await this.sessionManager.getOnlineUsers();
    const page = payload.page || 1;
    const limit = Math.min(payload.limit || 50, 100);

    const start = (page - 1) * limit;
    const users = allUsers.slice(start, start + limit);

    return {
      event: 'online_users',
      data: { users, total: allUsers.length, page },
    };
  }

  // ==================== Server-side Emit Utilities ====================

  emitToAll<T>(event: string, data: T): void {
    this.server.emit(event, data);
  }

  emitToRoom<T>(room: string, event: string, data: T): void {
    this.server.to(room).emit(event, data);
  }

  /**
   * Emit to user (all their devices, across all instances)
   */
  async emitToUser<T>(userId: string, event: string, data: T): Promise<void> {
    const sockets = await this.sessionManager.getUserSockets(userId);
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /**
   * Get stats for monitoring
   */
  async getStats(): Promise<{
    localConnections: number;
    onlineUsers: number;
    instanceId: string;
  }> {
    const onlineUsers = await this.sessionManager.getOnlineUsers();
    return {
      localConnections: this.sessionManager.getLocalConnectionCount(),
      onlineUsers: onlineUsers.length,
      instanceId: this.sessionManager.getInstanceId(),
    };
  }
}
