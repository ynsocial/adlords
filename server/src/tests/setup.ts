import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { redisClient } from '../config/redis';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  // Clear all collections
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }

  // Clear Redis cache
  await redisClient.flushall();
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
  await redisClient.quit();
});

// Global test utilities
global.createTestUser = async (role: string) => {
  // Implement test user creation logic
};

global.generateAuthToken = async (userId: string, role: string) => {
  // Implement auth token generation logic
};
