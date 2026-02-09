# High-Load Socket.io Design Guide

## Overview

This document describes the architecture and design patterns for handling **~10,000+ requests/second** with Socket.io in a NestJS + Fastify application, with horizontal scaling across multiple server instances.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client 1   │     │  Client 2   │     │  Client N   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                   ┌───────▼───────┐
                   │ Load Balancer │  (nginx/HAProxy)
                   │  sticky: IP   │
                   └───────┬───────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│  Server 1   │     │  Server 2   │     │  Server N   │
│ Port: 4000  │     │ Port: 4001  │     │ Port: 400N  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                   ┌───────▼───────┐
                   │ Redis Cluster │  (pub/sub)
                   └───────────────┘
```

## Key Components

### 1. Redis Adapter (`redis-io.adapter.ts`)

Enables horizontal scaling by using Redis pub/sub for cross-server event broadcasting.

```typescript
// All server instances share events through Redis
const redisIoAdapter = new RedisIoAdapter(app, configService);
await redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

### 2. Session Manager (`session.manager.ts`)

O(1) lookup for user-socket mappings with multi-device support.

```typescript
// Track user connections
sessionManager.registerUser(userId, socket);
sessionManager.getUserSockets(userId); // Returns all socket IDs for user
sessionManager.isUserOnline(userId); // Check presence
```

### 3. Rate Limiter (`rate-limiter.ts`)

Token bucket algorithm to prevent event flooding.

```typescript
// Configured per-event limits
if (!rateLimiter.isAllowed(socketId, 'send_message')) {
  return { event: 'error', data: 'Rate limit exceeded' };
}
```

## Socket Events Reference

| Event              | Direction       | Description          |
| ------------------ | --------------- | -------------------- |
| `ping`             | Client → Server | Health check         |
| `pong`             | Server → Client | Health response      |
| `join_room`        | Client → Server | Join a room          |
| `leave_room`       | Client → Server | Leave a room         |
| `send_message`     | Client → Server | Send message to room |
| `new_message`      | Server → Client | Receive message      |
| `direct_message`   | Client → Server | Send DM to user      |
| `user_joined`      | Server → Client | User joined room     |
| `user_left`        | Server → Client | User left room       |
| `update_status`    | Client → Server | Update presence      |
| `get_online_users` | Client → Server | Get online users     |

## Client Connection Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket'], // Prefer WebSocket
  auth: {
    userId: 'user123',
    token: 'jwt-token-here',
  },
});

// Join a room
socket.emit('join_room', { room: 'general' });

// Send message
socket.emit('send_message', {
  room: 'general',
  message: 'Hello!',
});

// Listen for messages
socket.on('new_message', (data) => {
  console.log(`${data.from}: ${data.message}`);
});

// Direct message
socket.emit('direct_message', {
  toUserId: 'user456',
  message: 'Private message',
});
```

## Load Balancer Configuration (nginx)

```nginx
upstream socketio {
    ip_hash;  # Sticky sessions
    server 127.0.0.1:4000;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
}

server {
    listen 80;

    location /socket.io/ {
        proxy_pass http://socketio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Performance Tuning

### Server-side

- **pingTimeout**: 60000 (60s) - Time before considering connection dead
- **pingInterval**: 25000 (25s) - Heartbeat interval
- **transports**: ['websocket', 'polling'] - WebSocket preferred

### Rate Limits (default)

- `send_message`: 10 messages/second
- `join_room`: 5 joins/second
- `ping`: 60 pings/second

## Running Multiple Instances

```bash
# Start multiple instances with different ports
PORT=4000 pnpm start:prod &
PORT=4001 pnpm start:prod &
PORT=4002 pnpm start:prod &
```

## Redis Requirements

Ensure Redis is running and accessible. Configure in `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

## Monitoring

```typescript
// Get server stats
const stats = appGateway.getStats();
// { connections: 1500, onlineUsers: 1200, rooms: 50 }
```
