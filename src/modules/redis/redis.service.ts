import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '@src/config';

@Injectable()
export class RedisService {
    private redis: Redis;

    constructor() {
        this.redis = new Redis({
            host: REDIS_HOST,
            port: REDIS_PORT,
        });
    }

    async set(key: string, value: string, time: number) {
        await this.redis.set(key, value, 'EX', time);
    }

    async get(key: string) {
        return await this.redis.get(key);
    }

    async del(key: string) {
        await this.redis.del(key);
    }

    async ttl(key: string) {
        return await this.redis.ttl(key);
    }
}
