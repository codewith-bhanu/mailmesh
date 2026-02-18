import { env } from "../config/env";

// Use raw connection options instead of an ioredis instance
// to avoid version conflicts between standalone ioredis and BullMQ's bundled ioredis.
export const redisConnection = {
  host: new URL(env.REDIS_URL).hostname || "localhost",
  port: Number(new URL(env.REDIS_URL).port) || 6379,
  maxRetriesPerRequest: null as null, // Required by BullMQ
};
