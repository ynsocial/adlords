import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'apply'
  | 'complete'
  | 'bulk_operation';

export type AuditEntity =
  | 'user'
  | 'company'
  | 'job'
  | 'application'
  | 'task'
  | 'system';

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  async log(data: AuditLogData): Promise<void> {
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        // Create audit log
        const auditLog = new AuditLog({
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date(),
        });

        await auditLog.save({ session });

        // Update user's last activity
        await User.findByIdAndUpdate(
          data.userId,
          { lastActivity: new Date() },
          { session }
        );
      });

      session.endSession();
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    entity?: AuditEntity;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        userId,
        action,
        entity,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = filters;

      const query: any = {};

      if (userId) query.userId = userId;
      if (action) query.action = action;
      if (entity) query.entity = entity;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'name email role')
          .lean(),
        AuditLog.countDocuments(query),
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  async getUserActivity(userId: string): Promise<{
    lastLogin?: Date;
    lastLogout?: Date;
    totalActions: number;
    recentActions: any[];
  }> {
    try {
      const [lastLogin, lastLogout, totalActions, recentActions] = await Promise.all([
        AuditLog.findOne({
          userId,
          action: 'login',
        })
          .sort({ timestamp: -1 })
          .lean(),
        AuditLog.findOne({
          userId,
          action: 'logout',
        })
          .sort({ timestamp: -1 })
          .lean(),
        AuditLog.countDocuments({ userId }),
        AuditLog.find({ userId })
          .sort({ timestamp: -1 })
          .limit(5)
          .lean(),
      ]);

      return {
        lastLogin: lastLogin?.timestamp,
        lastLogout: lastLogout?.timestamp,
        totalActions,
        recentActions,
      };
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      throw error;
    }
  }

  async getSystemActivity(): Promise<{
    totalLogins: number;
    totalActions: number;
    actionsByType: Record<string, number>;
    activityTimeline: any[];
  }> {
    try {
      const [totalLogins, totalActions, actionsByType, activityTimeline] =
        await Promise.all([
          AuditLog.countDocuments({ action: 'login' }),
          AuditLog.countDocuments(),
          AuditLog.aggregate([
            {
              $group: {
                _id: '$action',
                count: { $sum: 1 },
              },
            },
          ]),
          AuditLog.aggregate([
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$timestamp',
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: -1 } },
            { $limit: 30 },
          ]),
        ]);

      const actionCounts = actionsByType.reduce(
        (acc: Record<string, number>, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        },
        {}
      );

      return {
        totalLogins,
        totalActions,
        actionsByType: actionCounts,
        activityTimeline,
      };
    } catch (error) {
      console.error('Failed to fetch system activity:', error);
      throw error;
    }
  }

  async getEntityActivity(
    entity: AuditEntity,
    entityId: string
  ): Promise<{
    totalActions: number;
    recentActions: any[];
    actionsByUser: any[];
  }> {
    try {
      const [totalActions, recentActions, actionsByUser] = await Promise.all([
        AuditLog.countDocuments({ entity, entityId }),
        AuditLog.find({ entity, entityId })
          .sort({ timestamp: -1 })
          .limit(10)
          .populate('userId', 'name email role')
          .lean(),
        AuditLog.aggregate([
          { $match: { entity, entityId } },
          {
            $group: {
              _id: '$userId',
              count: { $sum: 1 },
              lastAction: { $max: '$timestamp' },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

      return {
        totalActions,
        recentActions,
        actionsByUser,
      };
    } catch (error) {
      console.error('Failed to fetch entity activity:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
