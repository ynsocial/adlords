import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { logError, logInfo } from '../config/logger';
import { IUser } from '../models/User';

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { user: IUser };
        if (!decoded || !decoded.user) {
          return next(new Error('Invalid token'));
        }

        socket.data.user = decoded.user;
        next();
      } catch (error) {
        logError(error as Error, { context: 'WebSocket Authentication' });
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.user._id;
      
      // Store socket connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket.id);

      logInfo('Client connected', { userId, socketId: socket.id });

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        const userSocketIds = this.userSockets.get(userId) || [];
        const updatedSocketIds = userSocketIds.filter(id => id !== socket.id);
        
        if (updatedSocketIds.length === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, updatedSocketIds);
        }

        logInfo('Client disconnected', { userId, socketId: socket.id });
      });

      // Handle subscription to job updates
      socket.on('subscribe:job', (jobId: string) => {
        socket.join(`job:${jobId}`);
        logInfo('Subscribed to job updates', { userId, jobId });
      });

      // Handle unsubscription from job updates
      socket.on('unsubscribe:job', (jobId: string) => {
        socket.leave(`job:${jobId}`);
        logInfo('Unsubscribed from job updates', { userId, jobId });
      });
    });
  }

  // Send notification to specific user
  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Send notification to all users interested in a job
  public sendJobUpdate(jobId: string, event: string, data: any) {
    this.io.to(`job:${jobId}`).emit(event, data);
  }

  // Send notification to multiple users
  public sendToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach(userId => {
      this.sendToUser(userId, event, data);
    });
  }

  // Broadcast to all connected clients (use sparingly)
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Check if a user is online
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.length || 0) > 0;
  }

  // Get all online users
  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Get socket count for a user
  public getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.length || 0;
  }

  // Close all connections
  public close() {
    this.io.close();
  }
}

// Create singleton instance
let instance: WebSocketService | null = null;

export const initializeWebSocket = (server: Server): WebSocketService => {
  if (!instance) {
    instance = new WebSocketService(server);
  }
  return instance;
};

export const getWebSocketService = (): WebSocketService => {
  if (!instance) {
    throw new Error('WebSocket service not initialized');
  }
  return instance;
};
