import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * RedisSessionManager: Redis-backed session management for multi-instance scaling.
 *
 * IMPORTANT: We only store socket IDs, not Socket objects.
 * - Socket objects are heavy (handlers, buffers, metadata)
 * - Socket.io already manages them internally
 * - Use server.to(socketId).emit() to send messages
 *
 * Redis Keys:
 * - socket:user:{socketId} → userId
 * - user:sockets:{userId} → Set<socketId>
 * - room:members:{roomName} → Set<userId>
 * - user:rooms:{userId} → Set<roomName>
 * - online:users → Set<userId>
 */
@Injectable()
export class RedisSessionManager implements OnModuleDestroy {
  private readonly logger = new Logger(RedisSessionManager.name);
  private readonly redis: Redis;
  private readonly PREFIX = 'ws:';
  private readonly SOCKET_TTL = 86400; // 24h

  // Only track local socket IDs (for cleanup on disconnect)
  private readonly localSocketIds = new Set<string>();
  private readonly instanceId: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const username = this.configService.get<string>('REDIS_USERNAME');

    this.redis = new Redis({
      host,
      port,
      password,
      username,
      keyPrefix: this.PREFIX,
    });

    this.instanceId = `inst:${Date.now().toString(36)}:${Math.random().toString(36).substr(2, 6)}`;

    this.redis.on('connect', () => {
      this.logger.log(`Redis Session connected (${this.instanceId})`);
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis Session error:', err);
    });
  }

  async onModuleDestroy(): Promise<void> {
    // Cleanup all local sockets
    for (const socketId of this.localSocketIds) {
      await this.unregisterSocket(socketId);
    }
    await this.redis.quit();
  }

  /**
   * Register user connection (only stores socketId, not Socket object)
   */
  async registerUser(userId: string, socketId: string): Promise<void> {
    this.localSocketIds.add(socketId);

    const pipeline = this.redis.pipeline();
    pipeline.set(`socket:user:${socketId}`, userId, 'EX', this.SOCKET_TTL);
    pipeline.sadd(`user:sockets:${userId}`, socketId);
    pipeline.expire(`user:sockets:${userId}`, this.SOCKET_TTL);
    pipeline.sadd('online:users', userId);
    await pipeline.exec();

    this.logger.debug(`User ${userId} registered (socket: ${socketId})`);
  }

  /**
   * Unregister socket connection
   */
  async unregisterSocket(socketId: string): Promise<string | undefined> {
    this.localSocketIds.delete(socketId);

    const userId = await this.redis.get(`socket:user:${socketId}`);
    if (!userId) return undefined;

    const pipeline = this.redis.pipeline();
    pipeline.srem(`user:sockets:${userId}`, socketId);
    pipeline.del(`socket:user:${socketId}`);

    // Check if user has other sockets
    const remaining = await this.redis.scard(`user:sockets:${userId}`);
    if (remaining <= 1) {
      pipeline.srem('online:users', userId);
      // Cleanup room memberships
      const rooms = await this.redis.smembers(`user:rooms:${userId}`);
      for (const room of rooms) {
        pipeline.srem(`room:members:${room}`, userId);
      }
      pipeline.del(`user:rooms:${userId}`);
    }

    await pipeline.exec();
    return userId;
  }

  /**
   * Get all socket IDs for a user (across ALL instances)
   */
  async getUserSockets(userId: string): Promise<string[]> {
    return this.redis.smembers(`user:sockets:${userId}`);
  }

  /**
   * Get user ID by socket ID
   */
  async getUserBySocket(socketId: string): Promise<string | null> {
    return this.redis.get(`socket:user:${socketId}`);
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    return (await this.redis.sismember('online:users', userId)) === 1;
  }

  /**
   * Get all online users
   */
  async getOnlineUsers(): Promise<string[]> {
    return this.redis.smembers('online:users');
  }

  /**
   * Get local connection count
   */
  getLocalConnectionCount(): number {
    return this.localSocketIds.size;
  }

  // Room management
  async addUserToRoom(userId: string, roomName: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.sadd(`room:members:${roomName}`, userId);
    pipeline.sadd(`user:rooms:${userId}`, roomName);
    await pipeline.exec();
  }

  async removeUserFromRoom(userId: string, roomName: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.srem(`room:members:${roomName}`, userId);
    pipeline.srem(`user:rooms:${userId}`, roomName);
    await pipeline.exec();
  }

  async getRoomMembers(roomName: string): Promise<string[]> {
    return this.redis.smembers(`room:members:${roomName}`);
  }

  async getUserRooms(userId: string): Promise<string[]> {
    return this.redis.smembers(`user:rooms:${userId}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}
