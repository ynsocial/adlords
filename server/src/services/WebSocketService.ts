import { Server, Socket } from 'socket.io';
import { RedisClientType } from 'redis';
import { logger } from '../config/logger';
import { IUser } from '../types';

export const EVENTS = {
  JOB_UPDATED: 'job:updated',
  JOB_CREATED: 'job:created',
  JOB_DELETED: 'job:deleted',
  APPLICATION_UPDATED: 'application:updated',
  APPLICATION_CREATED: 'application:created',
  NOTIFICATION: 'notification'
} as const;

type EventType = typeof EVENTS[keyof typeof EVENTS];

export class WebSocketService {
  private io: Server;
  private redisClient: RedisClientType;
  private static instance: WebSocketService;
  private readonly maxNotifications = 100;

  private constructor(io: Server, redisClient: RedisClientType) {
    this.io = io;
    this.redisClient = redisClient;
    this.setupSocketHandlers();
  }

  public static getInstance(io?: Server, redisClient?: RedisClientType): WebSocketService {
    if (!WebSocketService.instance) {
      if (!io || !redisClient) {
        throw new Error('WebSocketService must be initialized with io and redisClient');
      }
      WebSocketService.instance = new WebSocketService(io, redisClient);
    }
    return WebSocketService.instance;
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('Client connected to WebSocket');

      socket.on('authenticate', async (token: string) => {
        try {
          // Implement your authentication logic here
          const user: IUser = {} as IUser; // Replace with actual user authentication
          socket.data.user = user;
          await this.joinUserRooms(socket, user);
          await this.sendPendingNotifications(socket, user._id.toString());
        } catch (error) {
          logger.error('Authentication error:', error);
          socket.disconnect();
        }
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected from WebSocket');
      });
    });
  }

  private async joinUserRooms(socket: Socket, user: IUser): Promise<void> {
    const rooms = [`user:${user._id}`];
    if (user.role === 'company') {
      rooms.push(`company:${user._id}`);
    }
    await Promise.all(rooms.map(room => socket.join(room)));
  }

  public async emitJobEvent(type: keyof typeof EVENTS, jobId: string, data: any): Promise<void> {
    try {
      if (!type.startsWith('JOB_')) {
        throw new Error('Invalid job event type');
      }
      const event = EVENTS[type];
      this.io.to(`job:${jobId}`).emit(event, data);
    } catch (error) {
      logger.error(`Error emitting job event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async emitApplicationEvent(
    type: keyof typeof EVENTS,
    applicationId: string,
    jobId: string,
    data: any
  ): Promise<void> {
    try {
      if (!type.startsWith('APPLICATION_')) {
        throw new Error('Invalid application event type');
      }
      const event = EVENTS[type];
      this.io.to(`application:${applicationId}`).emit(event, data);
    } catch (error) {
      logger.error(`Error emitting application event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async sendNotification(userId: string, notification: any): Promise<void> {
    try {
      const notificationKey = `notifications:${userId}`;
      
      // Store notification in Redis
      await this.redisClient.lPush(notificationKey, JSON.stringify(notification));
      
      // Trim the list to keep only the latest notifications
      await this.redisClient.lTrim(notificationKey, 0, this.maxNotifications - 1);
      
      // Emit the notification to connected clients
      this.io.to(`user:${userId}`).emit(EVENTS.NOTIFICATION, notification);
    } catch (error) {
      logger.error(`Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      // Implement notification read status update logic
      logger.info(`Marking notification ${notificationId} as read for user ${userId}`);
    } catch (error) {
      logger.error(`Error marking notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendPendingNotifications(socket: Socket, userId: string): Promise<void> {
    try {
      const notificationKey = `notifications:${userId}`;
      const notifications = await this.redisClient.lRange(notificationKey, 0, -1);
      const parsedNotifications = notifications.map(n => JSON.parse(n));
      socket.emit('pending_notifications', parsedNotifications);
    } catch (error) {
      logger.error(`Error sending pending notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async clearNotifications(userId: string): Promise<void> {
    try {
      const notificationKey = `notifications:${userId}`;
      await this.redisClient.del(notificationKey);
    } catch (error) {
      logger.error(`Error clearing notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default WebSocketService;
