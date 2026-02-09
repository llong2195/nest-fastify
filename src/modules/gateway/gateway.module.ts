import { Module } from '@nestjs/common';

import { AppGateway } from './app.gateway';
import { RateLimiter } from './rate-limiter';
import { RedisSessionManager } from './redis-session.manager';

/**
 * GatewayModule: High-load Socket.io with Redis-backed scaling
 *
 * Multi-Instance Architecture:
 * - RedisSessionManager: Shared session state across all instances
 * - Redis Adapter: Cross-server event broadcasting
 * - RateLimiter: Per-instance rate limiting
 */
@Module({
  providers: [RedisSessionManager, RateLimiter, AppGateway],
  exports: [AppGateway, RedisSessionManager],
})
export class GatewayModule {}
