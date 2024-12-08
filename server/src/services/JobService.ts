import { FilterQuery } from 'mongoose';
import Job, { IJob } from '../models/Job';
import { AppError } from '../utils/errors';
import { redisClient } from '../config/redis';

export class JobService {
  private static CACHE_TTL = 3600; // 1 hour in seconds
  private static CACHE_PREFIX = 'job:';

  // Create a new job
  static async createJob(data: Partial<IJob>): Promise<IJob> {
    try {
      const job = new Job(data);
      await job.save();
      
      // Clear related cache
      await this.clearCache(`jobs:*`);
      
      return job;
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  // Get job by ID
  static async getJobById(id: string): Promise<IJob | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const job = await Job.findById(id).populate('companyId', 'name logo');
    
    if (job) {
      // Cache the result
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(job));
    }
    
    return job;
  }

  // Update job
  static async updateJob(
    id: string,
    data: Partial<IJob>,
    companyId: string
  ): Promise<IJob | null> {
    const job = await Job.findOneAndUpdate(
      { _id: id, companyId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`jobs:*`);

    return job;
  }

  // Delete job
  static async deleteJob(id: string, companyId: string): Promise<void> {
    const result = await Job.findOneAndDelete({ _id: id, companyId });
    
    if (!result) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`jobs:*`);
  }

  // Get jobs with filtering, sorting, and pagination
  static async getJobs(params: {
    filter?: FilterQuery<IJob>;
    sort?: string;
    page?: number;
    limit?: number;
    category?: string[];
    skills?: string[];
    location?: string;
    type?: string;
    budget?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    status?: string;
    companyId?: string;
  }): Promise<{
    jobs: IJob[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      filter = {},
      sort = '-createdAt',
      page = 1,
      limit = 10,
      category,
      skills,
      location,
      type,
      budget,
      status,
      companyId,
    } = params;

    // Build query
    let query: FilterQuery<IJob> = { ...filter };
    
    if (category && category.length > 0) {
      query.category = { $in: category };
    }
    
    if (skills && skills.length > 0) {
      query.skills = { $in: skills };
    }
    
    if (location) {
      query['location.type'] = location;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (budget) {
      if (budget.min !== undefined) {
        query['budget.range.min'] = { $gte: budget.min };
      }
      if (budget.max !== undefined) {
        query['budget.range.max'] = { $lte: budget.max };
      }
      if (budget.currency) {
        query['budget.currency'] = budget.currency;
      }
    }
    
    if (status) {
      query.status = status;
    }
    
    if (companyId) {
      query.companyId = companyId;
    }

    const cacheKey = `jobs:${JSON.stringify({
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
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('companyId', 'name logo')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Job.countDocuments(query),
    ]);

    const result = {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    // Cache the result
    await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  // Update job status
  static async updateJobStatus(
    id: string,
    status: IJob['status'],
    companyId: string
  ): Promise<IJob> {
    const job = await Job.findOneAndUpdate(
      { _id: id, companyId },
      { 
        $set: { status }
      },
      { new: true }
    );

    if (!job) {
      throw new AppError('Job not found or unauthorized', 404);
    }

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`jobs:*`);

    return job;
  }

  // Update moderation status (admin only)
  static async updateModerationStatus(
    id: string,
    status: 'Pending' | 'Approved' | 'Rejected',
    moderatorId: string,
    reason?: string
  ): Promise<IJob> {
    const job = await Job.findByIdAndUpdate(
      id,
      {
        $set: {
          'moderationStatus.status': status,
          'moderationStatus.moderatedBy': moderatorId,
          'moderationStatus.moderatedAt': new Date(),
          'moderationStatus.reason': reason,
          status: status === 'Approved' ? 'Active' : 'Rejected',
        },
      },
      { new: true }
    );

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
    await this.clearCache(`jobs:*`);

    return job;
  }

  // Increment view count
  static async incrementViewCount(id: string): Promise<void> {
    await Job.findByIdAndUpdate(id, {
      $inc: {
        views: 1,
        'statistics.totalViews': 1,
      },
    });

    // Clear related cache
    await this.clearCache(`${this.CACHE_PREFIX}${id}`);
  }

  // Search jobs
  static async searchJobs(
    searchTerm: string,
    params: {
      page?: number;
      limit?: number;
      filter?: FilterQuery<IJob>;
    }
  ): Promise<{
    jobs: IJob[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, filter = {} } = params;

    const query = {
      ...filter,
      $text: { $search: searchTerm },
      status: 'Active',
      'moderationStatus.status': 'Approved',
    };

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('companyId', 'name logo')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ score: { $meta: 'textScore' } })
        .exec(),
      Job.countDocuments(query),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper method to clear cache
  private static async clearCache(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
}

export default JobService;
