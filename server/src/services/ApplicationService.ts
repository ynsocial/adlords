import { FilterQuery } from 'mongoose';
import Application, { IApplication } from '../models/Application';
import Job from '../models/Job';
import Ambassador from '../models/Ambassador';
import { AppError } from '../utils/errors';
import { redisClient } from '../config/redis';
import { UserRole } from '../types';

export class ApplicationService {
  private static CACHE_TTL = 3600; // 1 hour in seconds
  private static CACHE_PREFIX = 'application:';

  // Create a new application
  static async createApplication(
    data: Partial<IApplication>,
    ambassadorId: string
  ): Promise<IApplication> {
    try {
      // Check if job exists and is accepting applications
      const job = await Job.findById(data.jobId);
      if (!job) {
        throw new AppError('Job not found', 404);
      }
      if (!job.isAcceptingApplications) {
        throw new AppError('Job is not accepting applications', 400);
      }

      // Check if ambassador exists and is verified
      const ambassador = await Ambassador.findById(ambassadorId);
      if (!ambassador) {
        throw new AppError('Ambassador not found', 404);
      }
      if (ambassador.verificationStatus !== 'Verified') {
        throw new AppError('Ambassador must be verified to apply', 400);
      }

      // Check for existing application
      const existingApplication = await Application.findOne({
        jobId: data.jobId,
        ambassadorId,
      });
      if (existingApplication) {
        throw new AppError('You have already applied for this job', 400);
      }

      // Create application
      const application = new Application({
        ...data,
        ambassadorId,
        submissionDate: new Date(),
        status: 'Pending',
      });

      await application.save();

      // Update job application count
      await Job.findByIdAndUpdate(data.jobId, {
        $inc: { 
          currentApplications: 1,
          'statistics.applications': 1,
        },
      });

      // Clear related cache
      await this.clearCache(`applications:*`);

      return application;
    } catch (error: any) {
      throw error;
    }
  }

  // Get application by ID
  static async getApplicationById(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<IApplication | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const application = await Application.findById(id)
      .populate('jobId', 'title companyId')
      .populate('ambassadorId', 'firstName lastName email');

    if (!application) {
      return null;
    }

    // Check authorization
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.COMPANY &&
      application.ambassadorId.toString() !== userId
    ) {
      throw new AppError('Unauthorized to view this application', 403);
    }

    // Cache the result
    await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(application));

    return application;
  }

  // Update application
  static async updateApplication(
    id: string,
    data: Partial<IApplication>,
    userId: string,
    userRole: UserRole
  ): Promise<IApplication> {
    const application = await Application.findById(id);
    
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Check authorization
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.COMPANY &&
      application.ambassadorId.toString() !== userId
    ) {
      throw new AppError('Unauthorized to update this application', 403);
    }

    // Set modified by info for timeline
    application.modifiedBy = userId;
    application.statusNote = data.statusNote;

    // Update application
    Object.assign(application, data);
    await application.save();

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`applications:*`);

    return application;
  }

  // Get applications with filtering
  static async getApplications(params: {
    filter?: FilterQuery<IApplication>;
    sort?: string;
    page?: number;
    limit?: number;
    userId: string;
    userRole: UserRole;
    jobId?: string;
    status?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  }): Promise<{
    applications: IApplication[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      filter = {},
      sort = '-submissionDate',
      page = 1,
      limit = 10,
      userId,
      userRole,
      jobId,
      status,
      dateRange,
    } = params;

    // Build query based on role and filters
    let query: FilterQuery<IApplication> = { ...filter };

    if (userRole === UserRole.AMBASSADOR) {
      query.ambassadorId = userId;
    } else if (userRole === UserRole.COMPANY) {
      const companyJobs = await Job.find({ companyId: userId }).select('_id');
      query.jobId = { $in: companyJobs.map(job => job._id) };
    }

    if (jobId) {
      query.jobId = jobId;
    }

    if (status && status.length > 0) {
      query.status = { $in: status };
    }

    if (dateRange) {
      query.submissionDate = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const cacheKey = `applications:${JSON.stringify({
      query,
      sort,
      page,
      limit,
    })}`;

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('jobId', 'title companyId')
        .populate('ambassadorId', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Application.countDocuments(query),
    ]);

    const result = {
      applications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    // Cache the result
    await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  // Withdraw application
  static async withdrawApplication(
    id: string,
    ambassadorId: string
  ): Promise<IApplication> {
    const application = await Application.findOne({
      _id: id,
      ambassadorId,
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (!application.canBeWithdrawn()) {
      throw new AppError('Application cannot be withdrawn in current status', 400);
    }

    application.status = 'Withdrawn';
    application.modifiedBy = ambassadorId;
    application.statusNote = 'Application withdrawn by ambassador';
    await application.save();

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`applications:*`);

    return application;
  }

  // Add feedback
  static async addFeedback(
    id: string,
    feedback: {
      rating: number;
      comment: string;
    },
    userId: string
  ): Promise<IApplication> {
    const application = await Application.findById(id);

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (!application.canAddFeedback()) {
      throw new AppError('Feedback can only be added to approved applications', 400);
    }

    application.feedback = {
      ...feedback,
      givenBy: userId,
      givenAt: new Date(),
    };

    await application.save();

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`applications:*`);

    return application;
  }

  // Schedule interview
  static async scheduleInterview(
    id: string,
    scheduleData: {
      date: Date;
      type: 'Phone' | 'Video' | 'In-Person';
      location?: string;
      meetingLink?: string;
      notes?: string;
      interviewers: string[];
    },
    userId: string
  ): Promise<IApplication> {
    const application = await Application.findById(id);

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'Shortlisted') {
      throw new AppError('Only shortlisted applications can be scheduled for interview', 400);
    }

    application.interviewSchedule = {
      ...scheduleData,
      interviewers: scheduleData.interviewers,
    };
    application.status = 'Interviewing';
    application.modifiedBy = userId;
    application.statusNote = 'Interview scheduled';

    await application.save();

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`applications:*`);

    return application;
  }

  // Add note
  static async addNote(
    id: string,
    note: {
      content: string;
      isPrivate: boolean;
    },
    userId: string
  ): Promise<IApplication> {
    const application = await Application.findById(id);

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    application.notes.push({
      ...note,
      author: userId,
      createdAt: new Date(),
    });

    await application.save();

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);

    return application;
  }

  // Helper method to clear cache
  private static async clearCache(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
}

export default ApplicationService;
