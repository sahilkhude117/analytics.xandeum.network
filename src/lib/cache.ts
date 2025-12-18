import { redis } from "./redis";

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get<T>(key);
    return cached;
  } catch (error) {
    console.error(`[Cache] Failed to get key ${key}:`, error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error(`[Cache] Failed to set key ${key}:`, error);
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Cache] Failed to delete key ${key}:`, error);
  }
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  if (ttlSeconds <= 0) {
    return await fn();
  }

  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();
  await setCached(key, result, ttlSeconds);
  return result;
}
