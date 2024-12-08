import { redisClient } from '../config/redis';

export const getCacheKey = (...args: any[]): string => {
  return args.join(':');
};

export const setCache = async (key: string, value: any, ttl?: number): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await redisClient.flushAll();
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};
