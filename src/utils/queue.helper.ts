import { Logger, LogLevel } from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';
import { pathToFileURL } from 'node:url';
import { RedisComponent } from '../components/redis.component';

const logger = new Logger('QUEUE');
const logLevel = process.env.LOG_LEVEL || 'error,warn';
logger.localInstance.setLogLevels?.(logLevel.split(',') as LogLevel[]);

export const getPathConfigSandbox = (path: string) => {
  const platform = process.platform;
  // https://docs.bullmq.io/guide/workers/sandboxed-processors
  if (platform == 'win32') {
    return pathToFileURL(path);
  }
  return path;
};

export const getConfigQueue = () => {
  const REDIS_QUEUE_DB = Number(process.env.REDIS_QUEUE_DB || '1');
  const redisClient = RedisComponent.getInstance(REDIS_QUEUE_DB).getClient();
  const configQueue: QueueOptions = {
    connection: redisClient,
    defaultJobOptions: {
      removeOnComplete: 5000,
    },
  };
  return configQueue;
};

export const debugQueueMsg = async (queue: Queue) => {
  const jobCount = await queue.getJobCounts();
  if (jobCount.active + jobCount.waiting > 0) {
    logger.debug(
      `The scheduled job ${queue.name} has already been running!`,
      jobCount,
    );
  }
};
