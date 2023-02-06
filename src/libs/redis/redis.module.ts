import { DynamicModule, Global, Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
import IORedis from 'ioredis';

export const IORedisKey = 'IOREDIS_MODULES_KEY';
import type { RedisAsyncModuleOptions } from './redis.interface';
import { RedisService } from './redis.service';

@Global()
@Module({})
export class IORedisModule {
    static async registerAsync({ useFactory, imports, inject }: RedisAsyncModuleOptions): Promise<DynamicModule> {
        const redisProvider = {
            provide: IORedisKey,
            useFactory: async (...args: any) => {
                const { connectionOptions, onClientReady } = await useFactory(...args);

                const client = new IORedis(connectionOptions);
                onClientReady(client);
                let count = 0;
                client.on('error', err => {
                    if (count > 10) {
                        throw new Error('Redis err :' + err);
                    }
                    count++;
                    Logger.error(err, IORedisModule.name);
                });
                return client;
            },
            inject,
        };

        return {
            module: IORedisModule,
            imports,
            providers: [redisProvider, RedisService],
            exports: [redisProvider, RedisService],
        };
    }
}
