import { Redis } from "@upstash/redis";

// Create Redis instance lazily to avoid build-time errors
let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Missing Upstash Redis credentials in environment variables");
    }
    
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  
  return redisInstance;
}

export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    return getRedis()[prop as keyof Redis];
  }
});
