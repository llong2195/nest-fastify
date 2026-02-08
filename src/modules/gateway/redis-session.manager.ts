import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Socket } from 'socket.io';

/**
 * RedisSessionManager: Redis-backed session management for multi-instance scaling.
 *
 * Why Redis?
 * - In-memory SessionManager only works on a single instance
 * - With multiple instances, each has its own session data
 * - User A on Server 1 cannot find User B on Server 2
 *
 * Solution: Store session data in Redis so ALL instances share:
 * - User → Socket mappings
 * - Room memberships
 * - Presence status
 *
 * Redis Keys Structure:
 * - socket:user:{socketId} → userId (which user owns this socket)
 * - user:sockets:{userId} → Set<socketId> (all sockets for a user)
 * - room:members:{roomName} → Set<userId> (all users in a room)
 * - user:rooms:{userId} → Set<roomName> (all rooms a user is in)
 * - online:users → Set<userId> (all online users)
 */
@Injectable()
export class RedisSessionManager implements OnModuleDestroy {
  private readonly logger = new Logger(RedisSessionManager.name);
  private readonly redis: Redis;

  // Prefix for all keys
  private readonly PREFIX = 'ws:';

  // TTL for socket entries (auto-cleanup if connection dies unexpectedly)
  private readonly SOCKET_TTL = 86400; // 24 hours

  // Local cache for socket instances (sockets can't be stored in Redis)
  private readonly localSockets = new Map<string, Socket>();

  // Current server instance ID (for tracking which server owns which socket)
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

    // Generate unique instance ID
    this.instanceId = `instance:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    this.redis.on('connect', () => {
      this.logger.log(`Redis Session connected to ${host}:${port}`);
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis Session error:', err);
    });
  }

  async onModuleDestroy(): Promise<void> {
    // Cleanup all sockets owned by this instance
    for (const socketId of this.localSockets.keys()) {
      await this.unregisterSocket(socketId);
    }
    await this.redis.quit();
  }

  /**
   * Register a user's socket connection
   */
  async registerUser(userId: string, socket: Socket): Promise<void> {
    const socketId = socket.id;

    // Store socket instance locally (can't store in Redis)
    this.localSockets.set(socketId, socket);

    // Store in Redis using pipeline for atomicity
    const pipeline = this.redis.pipeline();

    // Map socket to user
    pipeline.set(`socket:user:${socketId}`, userId, 'EX', this.SOCKET_TTL);

    // Map socket to instance (for cross-instance communication)
    pipeline.set(
      `socket:instance:${socketId}`,
      this.instanceId,
      'EX',
      this.SOCKET_TTL,
    );

    // Add socket to user's socket set
    pipeline.sadd(`user:sockets:${userId}`, socketId);
    pipeline.expire(`user:sockets:${userId}`, this.SOCKET_TTL);

    // Add to online users
    pipeline.sadd('online:users', userId);

    await pipeline.exec();

    this.logger.debug(
      `User ${userId} registered with socket ${socketId} on ${this.instanceId}`,
    );
  }

  /**
   * Unregister a socket connection
   */
  async unregisterSocket(socketId: string): Promise<string | undefined> {
    // Get user ID for this socket
    const userId = await this.redis.get(`socket:user:${socketId}`);

    if (userId) {
      const pipeline = this.redis.pipeline();

      // Remove socket from user's socket set
      pipeline.srem(`user:sockets:${userId}`, socketId);

      // Check remaining sockets count (need to do this separately)
      const remainingSockets = await this.redis.scard(`user:sockets:${userId}`);

      if (remainingSockets <= 1) {
        // This was the last socket, user is now offline
        pipeline.srem('online:users', userId);

        // Get and remove all room memberships
        const rooms = await this.redis.smembers(`user:rooms:${userId}`);
        for (const room of rooms) {
          pipeline.srem(`room:members:${room}`, userId);
        }
        pipeline.del(`user:rooms:${userId}`);
      }

      // Remove socket mappings
      pipeline.del(`socket:user:${socketId}`);
      pipeline.del(`socket:instance:${socketId}`);

      await pipeline.exec();

      this.logger.debug(`Socket ${socketId} unregistered (user: ${userId})`);
    }

    // Remove from local cache
    this.localSockets.delete(socketId);

    return userId || undefined;
  }

  /**
   * Get all socket IDs for a user (across ALL instances)
   */
  async getUserSockets(userId: string): Promise<string[]> {
    const sockets = await this.redis.smembers(`user:sockets:${userId}`);
    return sockets;
  }

  /**
   * Get socket IDs for a user on THIS instance only
   */
  async getLocalUserSockets(userId: string): Promise<string[]> {
    const allSockets = await this.getUserSockets(userId);
    return allSockets.filter((socketId) => this.localSockets.has(socketId));
  }

  /**
   * Get user ID by socket ID
   */
  async getUserBySocket(socketId: string): Promise<string | null> {
    return this.redis.get(`socket:user:${socketId}`);
  }

  /**
   * Get local socket instance by ID
   */
  getLocalSocket(socketId: string): Socket | undefined {
    return this.localSockets.get(socketId);
  }

  /**
   * Check if user is online (has at least one connection across all instances)
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
   * Get total connection count on THIS instance
   */
  getLocalConnectionCount(): number {
    return this.localSockets.size;
  }

  /**
   * Add user to a room
   */
  async addUserToRoom(userId: string, roomName: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.sadd(`room:members:${roomName}`, userId);
    pipeline.sadd(`user:rooms:${userId}`, roomName);
    await pipeline.exec();
  }

  /**
   * Remove user from a room
   */
  async removeUserFromRoom(userId: string, roomName: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.srem(`room:members:${roomName}`, userId);
    pipeline.srem(`user:rooms:${userId}`, roomName);
    await pipeline.exec();
  }

  /**
   * Get all members in a room (across all instances)
   */
  async getRoomMembers(roomName: string): Promise<string[]> {
    return this.redis.smembers(`room:members:${roomName}`);
  }

  /**
   * Get all rooms a user is in
   */
  async getUserRooms(userId: string): Promise<string[]> {
    return this.redis.smembers(`user:rooms:${userId}`);
  }

  /**
   * Get instance ID that owns a socket
   */
  async getSocketInstance(socketId: string): Promise<string | null> {
    return this.redis.get(`socket:instance:${socketId}`);
  }

  /**
   * Check if this instance owns the socket
   */
  isLocalSocket(socketId: string): boolean {
    return this.localSockets.has(socketId);
  }

  /**
   * Get current instance ID
   */
  getInstanceId(): string {
    return this.instanceId;
  }
}
