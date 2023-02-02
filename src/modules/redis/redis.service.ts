import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '@src/configs';

@Injectable()
export class RedisService {
    private redis: Redis;
    private logger = new Logger(RedisService.name);

    constructor() {
        try {
            this.redis = new Redis({
                host: REDIS_HOST,
                port: REDIS_PORT,
            });
        } catch (error) {
            this.logger.error(error);
        }
    }

    /**
     * @param  {string} key
     * @param  {ValueType} data
     * @param  {number} expireTime
     * @returns Promise
     */
    async set(key: string, data: string | number | Buffer, expireTime = 60): Promise<void> {
        if (data !== null) {
            if (expireTime === 0) {
                await this.redis.set(key, data);
            } else {
                await this.redis.set(key, data, 'EX', expireTime);
            }
        }
    }

    /**
     * @param  {string} key
     * @returns Promise
     */
    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    /**
     * @param  {string} key
     * @param  {unknown} data
     * @param  {number} expireTime
     * @returns Promise
     */
    async setJson(key: string, data: any | Record<string, unknown>, expireTime = 60): Promise<boolean> {
        if (data !== null) {
            if (expireTime === 0) {
                const result = await this.redis.set(key, JSON.stringify(data));
                return result === 'OK';
            } else {
                const result = await this.redis.set(key, JSON.stringify(data), 'EX', expireTime || 60);
                return result === 'OK';
            }
        }

        return false;
    }

    /**
     * @param  {string} key
     * @returns Promise
     */
    async getJson<T>(key: string): Promise<T> {
        const data = await this.redis.get(key);

        if (data !== null && data !== '') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return JSON.parse(data) as T;
        }

        return null;
    }

    /**
     * @return int
     * @param key
     * @param field
     * @param value
     */
    async hSet(key: string, field: string, value: string | number): Promise<number> {
        return this.redis.hset(key, field, value);
    }

    /**
     * @param key
     * @param fields
     * @returns {Promise<*>}
     */
    async hmSet(key: string, fields: Map<string, any>): Promise<'OK'> {
        return this.redis.hmset(key, fields);
    }

    /**
     * @return string
     * @param key
     * @param field
     */
    async hGet(key: string, field: string): Promise<string> {
        return this.redis.hget(key, field);
    }

    /**
     * @return string
     * @param key
     * @param field
     */
    async hGetJson<T>(key: string, field: string): Promise<null | T> {
        try {
            const data = await this.redis.hget(key, field);
            if (data !== null && data !== '') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(data) as T;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    /**
     * @param key
     * @returns {Promise<*>}
     */
    async hGetAll(key: string): Promise<Record<string, string>> {
        return this.redis.hgetall(key);
    }

    /**
     * @param  {string} name
     * @param  {string} key
     * @returns Promise
     */
    async hDel(name: string, key: string): Promise<number> {
        return this.redis.hdel(name, key);
    }

    /**
     * @param  {string} key
     * @returns Promise
     */
    async delete(key: string): Promise<number> {
        return this.redis.del(key);
    }

    /**
     * @param  {string} key
     * @returns Promise
     */
    async deleteArr(key: string[]): Promise<number> {
        return this.redis.del(key);
    }

    /**
     * @param  {string} key
     * @param  {string|number} data
     * @returns Promise
     */
    async lPush(key: string, data: string | number): Promise<number> {
        if (data !== null) {
            return this.redis.lpush(key, data);
        }

        return 0;
    }

    /**
     * @param  {string} key
     * @param  {string|number} data
     * @returns Promise
     */
    async rPush(key: string, data: string | number): Promise<number> {
        if (data !== null) {
            return this.redis.rpush(key, data);
        }

        return 0;
    }

    /**
     * @param  {string} key
     * @returns Promise
     */
    async lPop(key: string): Promise<string> {
        return await this.redis.lpop(key);
    }

    /**
     * @param  {string} key
     * @returns Promise
     */
    async rPop(key: string): Promise<string> {
        return await this.redis.rpop(key);
    }

    /**
     * @param  {string} name
     * @param  {string} key
     * @param  {number} value
     * @returns Promise
     */
    async inc(name: string, key: string, value: number): Promise<number> {
        return this.redis.hincrby(name, key, value);
    }

    /**
     * @param  {string} key
     * @param  {string|number} value
     * @returns Promise
     */
    async sAdd(key: string, value: (string | Buffer | number)[]): Promise<number> {
        if (value !== null) {
            return this.redis.sadd(key, value);
        }

        return null;
    }

    /**
     * @param  {string} key
     * @param  {string} value
     * @returns Promise
     */
    async sisMember(key: string, value: string | number | Buffer): Promise<boolean> {
        if (value !== null) {
            const ret = await this.redis.sismember(key, value);

            return !!ret;
        }

        return false;
    }

    async sMember(key: string): Promise<string[]> {
        return this.redis.smembers(key);
    }

    /**
     * @param  {string[]} keys
     * @param  {number[]} mapTo
     * @returns Promise
     */
    async gets<T>(keys: string[], mapTo: number[]): Promise<Map<number, T>> {
        const result = await this.redis.mget(keys);

        const mapped: Map<number, T> = new Map<number, T>();

        mapTo.forEach((id, index) => {
            mapped.set(id, result[index] as unknown as T);
        });

        return mapped;
    }

    //     async hgets(name: string, keys: string[]): Promise<Map<unknown, unknown>> {
    //         const result = await this.hmget(name, keys)

    //         const map = new Map()

    //         keys.forEach((id, index) => {
    //             map.set(id, result[index])
    //         })

    //         return map
    //     }

    /**
     * @returns Promise
     */
    async getKeys(): Promise<string[]> {
        return this.redis.keys('*');
    }

    /**
     * @returns Promise
     */
    async getByKeys(key: string): Promise<string[]> {
        return await this.redis.keys(`${key}*`);
    }
}
