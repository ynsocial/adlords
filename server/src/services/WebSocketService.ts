import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { verifyToken } from '../utils/jwt';
import Logger from '../utils/logger';
import { redisClient } from '../config/redis';

export class WebSocketService {
  private static io: SocketServer;
  private static readonly SOCKET_EVENTS = {
    JOB_UPDATED: 'job:updated',
    JOB_CREATED: 'job:created',
    JOB_DELETED: 'job:deleted',
    APPLICATION_UPDATED: 'application:updated',
    APPLICATION_CREATED: 'application:created',
    NOTIFICATION: 'notification',
  };

  static initialize(server: Server): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = await verifyToken(token);
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      const userId = socket.data.user.id;
      const userRole = socket.data.user.role;

      Logger.info(`User connected: ${userId} (${userRole})`);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Join role-specific room
      socket.join(`role:${userRole}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        Logger.info(`User disconnected: ${userId}`);
      });

      // Error handling
      socket.on('error', (error) => {
        Logger.error(`Socket error for user ${userId}: ${error.message}`);
      });
    });

    Logger.info('WebSocket server initialized');
  }

  // Notify about job updates
  static async notifyJobUpdate(jobId: string, action: 'update' | 'create' | 'delete', data: any): Promise<void> {
    try {
      const event = this.SOCKET_EVENTS[`JOB_${action.toUpperCase()}`];
      
      // Get job's company ID
      const companyId = data.companyId;

      // Emit to relevant rooms
      this.io.to(`role:admin`).emit(event, { jobId, data });
      this.io.to(`company:${companyId}`).emit(event, { jobId, data });

      if (action !== 'delete' && data.status === 'Active') {
        this.io.to('role:ambassador').emit(event, { jobId, data });
      }

      Logger.info(`Job ${action} notification sent for job ${jobId}`);
    } catch (error) {
      Logger.error(`Error sending job ${action} notification: ${error.message}`);
    }
  }

  // Notify about application updates
  static async notifyApplicationUpdate(
    applicationId: string,
    action: 'update' | 'create',
    data: any
  ): Promise<void> {
    try {
      const event = this.SOCKET_EVENTS[`APPLICATION_${action.toUpperCase()}`];
      
      // Get relevant IDs
      const { ambassadorId, jobId } = data;
      const companyId = data.job?.companyId;

      // Emit to relevant users/rooms
      this.io.to(`user:${ambassadorId}`).emit(event, { applicationId, data });
      
      if (companyId) {
        this.io.to(`company:${companyId}`).emit(event, { applicationId, data });
      }

      this.io.to('role:admin').emit(event, { applicationId, data });

      Logger.info(`Application ${action} notification sent for application ${applicationId}`);
    } catch (error) {
      Logger.error(`Error sending application ${action} notification: ${error.message}`);
    }
  }

  // Send personal notification
  static async sendNotification(userId: string, notification: {
    type: string;
    message: string;
    data?: any;
  }): Promise<void> {
    try {
      this.io.to(`user:${userId}`).emit(this.SOCKET_EVENTS.NOTIFICATION, notification);

      // Store notification in Redis for offline users
      const userNotifications = `notifications:${userId}`;
      await redisClient.lpush(userNotifications, JSON.stringify({
        ...notification,
        timestamp: new Date().toISOString(),
      }));
      await redisClient.ltrim(userNotifications, 0, 99); // Keep last 100 notifications

      Logger.info(`Notification sent to user ${userId}`);
    } catch (error) {
      Logger.error(`Error sending notification: ${error.message}`);
    }
  }

  // Send broadcast notification to a role
  static async broadcastToRole(role: string, notification: {
    type: string;
    message: string;
    data?: any;
  }): Promise<void> {
    try {
      this.io.to(`role:${role}`).emit(this.SOCKET_EVENTS.NOTIFICATION, notification);
      Logger.info(`Broadcast notification sent to role ${role}`);
    } catch (error) {
      Logger.error(`Error broadcasting notification: ${error.message}`);
    }
  }

  // Get user's offline notifications
  static async getOfflineNotifications(userId: string): Promise<any[]> {
    try {
      const userNotifications = `notifications:${userId}`;
      const notifications = await redisClient.lrange(userNotifications, 0, -1);
      return notifications.map(n => JSON.parse(n));
    } catch (error) {
      Logger.error(`Error getting offline notifications: ${error.message}`);
      return [];
    }
  }

  // Clear user's offline notifications
  static async clearOfflineNotifications(userId: string): Promise<void> {
    try {
      await redisClient.del(`notifications:${userId}`);
    } catch (error) {
      Logger.error(`Error clearing offline notifications: ${error.message}`);
    }
  }
}

export default WebSocketService;
