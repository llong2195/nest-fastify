import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const password =
      this.configService.get<string>('REDIS_PASSWORD') || undefined;
    const username =
      this.configService.get<string>('REDIS_USERNAME') || undefined;

    const pubClient = new Redis({
      host,
      port,
      password,
      username,
    });
    const subClient = pubClient.duplicate();

    await new Promise<void>((resolve, reject) => {
      pubClient.once('connect', () => {
        this.logger.log(`Redis Pub connected to ${host}:${port}`);
        resolve();
      });
      pubClient.once('error', reject);
    });

    pubClient.on('error', (err) => {
      this.logger.error('Redis Pub error', err);
    });

    subClient.on('connect', () => {
      this.logger.log(`Redis Sub connected to ${host}:${port}`);
    });
    subClient.on('error', (err) => {
      this.logger.error('Redis Sub error', err);
    });

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    }) as Server;
    server.adapter(this.adapterConstructor);
    this.logger.log('Socket.IO server initialized with Redis adapter');
    return server;
  }
}
