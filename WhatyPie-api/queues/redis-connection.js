import IORedis from 'ioredis';

/** BullMQ requires maxRetriesPerRequest: null on the ioredis connection. */
export const BULLMQ_REDIS_OPTIONS = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export function createRedisConnection() {
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, BULLMQ_REDIS_OPTIONS);
  }

  return new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ...BULLMQ_REDIS_OPTIONS,
  });
}

export default createRedisConnection;
