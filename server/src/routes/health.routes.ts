import { Router } from 'express';
import { getWebSocketService } from '../services/WebSocketService';
import { logInfo } from '../config/logger';

const router = Router();

router.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    websocket: {
      status: 'OK',
      activeConnections: getWebSocketService().getOnlineUsers().length
    }
  };

  try {
    logInfo('Health check performed', healthCheck);
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error instanceof Error ? error.message : 'Error';
    res.status(503).json(healthCheck);
  }
});

export default router;
