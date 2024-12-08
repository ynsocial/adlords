import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { AuditLog } from '../models/AuditLog';
import { Cache } from '../utils/cache';

const analyticsCache = new Cache(60 * 15); // 15 minutes cache

class AnalyticsService {
  // Platform Overview Analytics
  async getPlatformOverview(): Promise<any> {
    const cacheKey = 'platform_overview';
    const cached = analyticsCache.get(cacheKey);
    if (cached) return cached;

    try {
      const [
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        totalTasks,
        recentActivity,
      ] = await Promise.all([
        User.countDocuments(),
        Company.countDocuments(),
        Job.countDocuments(),
        Application.countDocuments(),
        Task.countDocuments(),
        AuditLog.find()
          .sort({ timestamp: -1 })
          .limit(10)
          .populate('userId', 'name email role')
          .lean(),
      ]);

      const result = {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        totalTasks,
        recentActivity,
      };

      analyticsCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get platform overview:', error);
      throw error;
    }
  }

  // Company Analytics
  async getCompanyAnalytics(companyId: string): Promise<any> {
    const cacheKey = `company_analytics_${companyId}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return cached;

    try {
      const [
        totalJobs,
        activeJobs,
        totalApplications,
        applicationsByStatus,
        jobPerformance,
      ] = await Promise.all([
        Job.countDocuments({ company: companyId }),
        Job.countDocuments({
          company: companyId,
          status: 'active',
        }),
        Application.countDocuments({
          company: companyId,
        }),
        Application.aggregate([
          { $match: { company: new mongoose.Types.ObjectId(companyId) } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Job.aggregate([
          { $match: { company: new mongoose.Types.ObjectId(companyId) } },
          {
            $lookup: {
              from: 'applications',
              localField: '_id',
              foreignField: 'job',
              as: 'applications',
            },
          },
          {
            $project: {
              title: 1,
              status: 1,
              createdAt: 1,
              applicationCount: { $size: '$applications' },
              viewCount: '$metrics.views',
              conversionRate: {
                $multiply: [
                  {
                    $cond: [
                      { $gt: ['$metrics.views', 0] },
                      {
                        $divide: [
                          { $size: '$applications' },
                          '$metrics.views',
                        ],
                      },
                      0,
                    ],
                  },
                  100,
                ],
              },
            },
          },
        ]),
      ]);

      const result = {
        totalJobs,
        activeJobs,
        totalApplications,
        applicationsByStatus: applicationsByStatus.reduce(
          (acc: Record<string, number>, curr: any) => {
            acc[curr._id] = curr.count;
            return acc;
          },
          {}
        ),
        jobPerformance,
      };

      analyticsCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get company analytics:', error);
      throw error;
    }
  }

  // Ambassador Analytics
  async getAmbassadorAnalytics(ambassadorId: string): Promise<any> {
    const cacheKey = `ambassador_analytics_${ambassadorId}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return cached;

    try {
      const [
        totalApplications,
        applicationsByStatus,
        totalTasks,
        tasksByStatus,
        earnings,
      ] = await Promise.all([
        Application.countDocuments({ ambassador: ambassadorId }),
        Application.aggregate([
          { $match: { ambassador: new mongoose.Types.ObjectId(ambassadorId) } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Task.countDocuments({ ambassador: ambassadorId }),
        Task.aggregate([
          { $match: { ambassador: new mongoose.Types.ObjectId(ambassadorId) } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Task.aggregate([
          { $match: { ambassador: new mongoose.Types.ObjectId(ambassadorId) } },
          {
            $group: {
              _id: {
                month: { $month: '$completedAt' },
                year: { $year: '$completedAt' },
              },
              totalEarnings: { $sum: '$payment.amount' },
              totalHours: { $sum: '$hours' },
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
        ]),
      ]);

      const result = {
        totalApplications,
        applicationsByStatus: applicationsByStatus.reduce(
          (acc: Record<string, number>, curr: any) => {
            acc[curr._id] = curr.count;
            return acc;
          },
          {}
        ),
        totalTasks,
        tasksByStatus: tasksByStatus.reduce(
          (acc: Record<string, number>, curr: any) => {
            acc[curr._id] = curr.count;
            return acc;
          },
          {}
        ),
        earnings,
      };

      analyticsCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get ambassador analytics:', error);
      throw error;
    }
  }

  // Job Analytics
  async getJobAnalytics(jobId: string): Promise<any> {
    const cacheKey = `job_analytics_${jobId}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached) return cached;

    try {
      const [job, applications, applicationTimeline] = await Promise.all([
        Job.findById(jobId).lean(),
        Application.find({ job: jobId })
          .populate('ambassador', 'name email')
          .lean(),
        Application.aggregate([
          { $match: { job: new mongoose.Types.ObjectId(jobId) } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const result = {
        job,
        totalApplications: applications.length,
        applications,
        applicationTimeline,
        metrics: {
          views: job?.metrics?.views || 0,
          conversionRate:
            job?.metrics?.views > 0
              ? (applications.length / job.metrics.views) * 100
              : 0,
        },
      };

      analyticsCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get job analytics:', error);
      throw error;
    }
  }

  // Performance Analytics
  async getPerformanceAnalytics(): Promise<any> {
    const cacheKey = 'performance_analytics';
    const cached = analyticsCache.get(cacheKey);
    if (cached) return cached;

    try {
      const [
        averageApplicationsPerJob,
        topPerformingJobs,
        topPerformingCompanies,
        topAmbassadors,
      ] = await Promise.all([
        Application.aggregate([
          {
            $group: {
              _id: '$job',
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: null,
              average: { $avg: '$count' },
            },
          },
        ]),
        Job.aggregate([
          {
            $lookup: {
              from: 'applications',
              localField: '_id',
              foreignField: 'job',
              as: 'applications',
            },
          },
          {
            $project: {
              title: 1,
              company: 1,
              applicationCount: { $size: '$applications' },
              conversionRate: {
                $multiply: [
                  {
                    $cond: [
                      { $gt: ['$metrics.views', 0] },
                      {
                        $divide: [
                          { $size: '$applications' },
                          '$metrics.views',
                        ],
                      },
                      0,
                    ],
                  },
                  100,
                ],
              },
            },
          },
          { $sort: { applicationCount: -1 } },
          { $limit: 10 },
        ]),
        Company.aggregate([
          {
            $lookup: {
              from: 'jobs',
              localField: '_id',
              foreignField: 'company',
              as: 'jobs',
            },
          },
          {
            $lookup: {
              from: 'applications',
              localField: 'jobs._id',
              foreignField: 'job',
              as: 'applications',
            },
          },
          {
            $project: {
              name: 1,
              totalJobs: { $size: '$jobs' },
              totalApplications: { $size: '$applications' },
              averageApplicationsPerJob: {
                $cond: [
                  { $gt: [{ $size: '$jobs' }, 0] },
                  {
                    $divide: [
                      { $size: '$applications' },
                      { $size: '$jobs' },
                    ],
                  },
                  0,
                ],
              },
            },
          },
          { $sort: { totalApplications: -1 } },
          { $limit: 10 },
        ]),
        User.aggregate([
          { $match: { role: 'ambassador' } },
          {
            $lookup: {
              from: 'tasks',
              localField: '_id',
              foreignField: 'ambassador',
              as: 'tasks',
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              totalTasks: { $size: '$tasks' },
              totalEarnings: {
                $sum: '$tasks.payment.amount',
              },
              averageRating: { $avg: '$tasks.rating' },
            },
          },
          { $sort: { totalEarnings: -1 } },
          { $limit: 10 },
        ]),
      ]);

      const result = {
        averageApplicationsPerJob: averageApplicationsPerJob[0]?.average || 0,
        topPerformingJobs,
        topPerformingCompanies,
        topAmbassadors,
      };

      analyticsCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
