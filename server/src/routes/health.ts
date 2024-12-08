import express from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import Logger from '../utils/logger';

const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    api: {
      uptime: number;
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
  version: string;
}

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const status: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'disconnected',
        },
        redis: {
          status: 'disconnected',
        },
        api: {
          uptime: process.uptime(),
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
          },
        },
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    // Check MongoDB connection
    const dbStartTime = Date.now();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      status.services.database = {
        status: 'connected',
        latency: Date.now() - dbStartTime,
      };
    }

    // Check Redis connection
    const redisStartTime = Date.now();
    if (redisClient.isOpen) {
      await redisClient.ping();
      status.services.redis = {
        status: 'connected',
        latency: Date.now() - redisStartTime,
      };
    }

    // Set overall status
    if (
      status.services.database.status === 'disconnected' ||
      status.services.redis.status === 'disconnected'
    ) {
      status.status = 'unhealthy';
    }

    // Log health check results
    Logger.info(`Health check completed: ${status.status}`);

    // Set cache control headers
    res.set('Cache-Control', 'no-cache');
    
    res.status(status.status === 'healthy' ? 200 : 503).json(status);
  } catch (error: any) {
    Logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Detailed metrics endpoint (protected)
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        versions: process.versions,
      },
      database: {
        connections: mongoose.connection.states,
        collections: await mongoose.connection.db.collections(),
      },
      redis: {
        status: redisClient.isOpen,
        info: await redisClient.info(),
      },
    };

    res.json(metrics);
  } catch (error: any) {
    Logger.error(`Metrics collection failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// Liveness probe endpoint
router.get('/liveness', (req, res) => {
  res.status(200).send('OK');
});

// Readiness probe endpoint
router.get('/readiness', async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not ready');
    }

    // Check Redis connection
    if (!redisClient.isOpen) {
      throw new Error('Redis not ready');
    }

    res.status(200).send('OK');
  } catch (error: any) {
    Logger.error(`Readiness check failed: ${error.message}`);
    res.status(503).send('Not Ready');
  }
});

export default router;
