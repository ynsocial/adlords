import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../config/logger';
import { verifyToken } from '../utils/jwt';
import { EventType } from '../types/enums';

interface SocketData {
  userId: string;
  role: string;
}

class WebSocketService {
  private io: Server;
  private static instance: WebSocketService;

  private constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  public static getInstance(server?: HttpServer): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        if (!token) {
          throw new Error('Authentication token is required');
        }

        const decoded = await verifyToken(token);
        socket.data = {
          userId: decoded.id,
          role: decoded.role
        };
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const { userId, role } = socket.data as SocketData;
      logger.info(`Client connected: ${userId} (${role})`);

      socket.join(userId);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${userId}`);
      });

      socket.on('error', (error) => {
        logger.error('Socket error:', error);
      });
    });
  }

  public emitToUser(userId: string, event: EventType, data: any): void {
    try {
      this.io.to(userId).emit(event, data);
      logger.debug(`Emitted ${event} to user ${userId}`, { data });
    } catch (error) {
      logger.error(`Error emitting ${event} to user ${userId}:`, error);
    }
  }

  public emitToAll(event: EventType, data: any): void {
    try {
      this.io.emit(event, data);
      logger.debug(`Emitted ${event} to all users`, { data });
    } catch (error) {
      logger.error(`Error emitting ${event} to all users:`, error);
    }
  }

  public emitToRole(role: string, event: EventType, data: any): void {
    try {
      const sockets = Array.from(this.io.sockets.sockets.values());
      const roleSpecificSockets = sockets.filter(
        (socket) => (socket.data as SocketData).role === role
      );

      roleSpecificSockets.forEach((socket) => {
        socket.emit(event, data);
      });

      logger.debug(`Emitted ${event} to role ${role}`, { data });
    } catch (error) {
      logger.error(`Error emitting ${event} to role ${role}:`, error);
    }
  }
}

export default WebSocketService;
