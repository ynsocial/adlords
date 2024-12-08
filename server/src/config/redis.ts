import { createClient } from 'redis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

export const disconnectRedis = async () => {
  try {
    await redisClient.disconnect();
  } catch (error) {
    logger.error('Redis disconnection error:', error);
    throw error;
  }
};
