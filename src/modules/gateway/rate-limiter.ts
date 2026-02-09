import { Injectable, Logger } from '@nestjs/common';

/**
 * RateLimiter: Protects against socket event flooding.
 * Essential for handling ~10,000 req/s by preventing abuse.
 *
 * Design patterns for high load:
 * - Token bucket algorithm for smooth rate limiting
 * - Per-user and per-event rate limits
 * - Sliding window for accurate rate calculation
 */
@Injectable()
export class RateLimiter {
  private readonly logger = new Logger(RateLimiter.name);

  // socketId -> { eventName -> { tokens, lastRefill } }
  private readonly buckets = new Map<
    string,
    Map<string, { tokens: number; lastRefill: number }>
  >();

  // Configuration
  private readonly config = {
    // Default: 100 events per second per socket per event type
    defaultMaxTokens: 100,
    defaultRefillRate: 100, // tokens per second

    // Event-specific limits (eventName -> { maxTokens, refillRate })
    eventLimits: new Map<string, { maxTokens: number; refillRate: number }>([
      ['send_message', { maxTokens: 30, refillRate: 10 }], // 10 messages/second max
      ['join_room', { maxTokens: 10, refillRate: 5 }], // 5 joins/second max
      ['ping', { maxTokens: 60, refillRate: 60 }], // 60 pings/second
    ]),
  };

  /**
   * Check if an event is allowed (has available tokens)
   * Returns true if allowed, false if rate limited
   */
  isAllowed(socketId: string, eventName: string): boolean {
    const now = Date.now();

    // Get or create socket bucket map
    if (!this.buckets.has(socketId)) {
      this.buckets.set(socketId, new Map());
    }
    const socketBuckets = this.buckets.get(socketId)!;

    // Get limits for this event
    const limits = this.config.eventLimits.get(eventName) || {
      maxTokens: this.config.defaultMaxTokens,
      refillRate: this.config.defaultRefillRate,
    };

    // Get or create bucket for this event
    if (!socketBuckets.has(eventName)) {
      socketBuckets.set(eventName, {
        tokens: limits.maxTokens,
        lastRefill: now,
      });
    }
    const bucket = socketBuckets.get(eventName)!;

    // Refill tokens based on time elapsed
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    const refillAmount = Math.floor(elapsed * limits.refillRate);
    if (refillAmount > 0) {
      bucket.tokens = Math.min(limits.maxTokens, bucket.tokens + refillAmount);
      bucket.lastRefill = now;
    }

    // Check if we have tokens
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }

    this.logger.warn(
      `Rate limit exceeded for socket ${socketId} on event ${eventName}`,
    );
    return false;
  }

  /**
   * Clean up buckets for disconnected socket
   */
  cleanup(socketId: string): void {
    this.buckets.delete(socketId);
  }

  /**
   * Configure event-specific limits
   */
  setEventLimit(
    eventName: string,
    maxTokens: number,
    refillRate: number,
  ): void {
    this.config.eventLimits.set(eventName, { maxTokens, refillRate });
  }
}
