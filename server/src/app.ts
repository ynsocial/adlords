import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { initializeWebSocket } from './services/WebSocketService';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';

const app = express();
const server = createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);

export { app, server };
