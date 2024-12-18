import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import authRoutes from './routes/auth.routes';
import { logger, stream, errorHandler, Sentry } from './config/logger';
import config from './config/config';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Initialize Sentry request handler
app.use(Sentry.Handlers.requestHandler());

// Redis Client Setup
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', err => logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => logger.info('MongoDB Connected'))
  .catch(err => logger.error('MongoDB Connection Error:', err));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100')
});
app.use(limiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      services: {
        redis: await redisClient.ping() === 'PONG' ? 'healthy' : 'unhealthy',
        mongodb: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy'
      }
    };
    res.status(200).json(healthcheck);
  } catch (error) {
    res.status(500).json({
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);

// Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle process termination
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await redisClient.quit();
  await mongoose.connection.close();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
