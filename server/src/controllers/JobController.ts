import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/JobService';
import { validateJob, validateJobFilters } from '../validators/jobValidator';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../types';
import { Job } from '../models/Job';
import { Company } from '../models/Company';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../utils/errors';
import { IUser, IJob } from '../types';

export class JobController {
  // Create new job
  static createJob = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user as IUser;
      if (user.role !== UserRole.COMPANY) {
        throw new UnauthorizedError('Only companies can create jobs');
      }

      const company = await Company.findOne({ userId: user._id });
      if (!company) {
        throw new NotFoundError('Company not found');
      }

      const jobData: Partial<IJob> = {
        ...req.body,
        companyId: company._id,
        status: 'Draft',
        metadata: {
          views: 0,
          applications: 0,
          isHighlighted: false,
          lastActivityAt: new Date()
        }
      };

      const validatedData = await validateJob(jobData);
      const job = await JobService.createJob(validatedData);
      
      res.status(201).json({
        success: true,
        data: job,
      });
    }
  );

  // Get job by ID
  static getJobById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { jobId } = req.params;
      const job = await JobService.getJobById(jobId).populate('companyId', 'name logo');

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Increment view count
      await JobService.incrementViewCount(jobId);

      res.status(200).json({
        success: true,
        data: job,
      });
    }
  );

  // Update job
  static updateJob = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user as IUser;
      const { jobId } = req.params;

      const job = await JobService.getJobById(jobId);
      if (!job) {
        throw new NotFoundError('Job not found');
      }

      const company = await Company.findOne({ userId: user._id });
      if (!company || !job.companyId.equals(company._id)) {
        throw new UnauthorizedError('Not authorized to update this job');
      }

      const validatedData = await validateJob(req.body, true);
      const updates: Partial<IJob> = {
        ...validatedData,
        metadata: {
          ...job.metadata,
          lastActivityAt: new Date()
        }
      };

      const updatedJob = await JobService.updateJob(
        jobId,
        updates,
        user.companyId
      );

      res.status(200).json({
        success: true,
        data: updatedJob,
      });
    }
  );

  // Delete job
  static deleteJob = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user as IUser;
      const { jobId } = req.params;

      const job = await JobService.getJobById(jobId);
      if (!job) {
        throw new NotFoundError('Job not found');
      }

      const company = await Company.findOne({ userId: user._id });
      if (!company || !job.companyId.equals(company._id)) {
        throw new UnauthorizedError('Not authorized to delete this job');
      }

      await JobService.deleteJob(jobId, user.companyId);

      res.status(204).json({
        success: true,
        data: null,
      });
    }
  );

  // Get all jobs with filtering
  static getJobs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        status,
        type,
        category,
        location,
        page = 1,
        limit = 10,
        sort = '-createdAt'
      } = req.query;

      const filters = await validateJobFilters(req.query);
      const query: any = {};
      if (status) query.status = status;
      if (type) query.type = type;
      if (category) query.category = category;
      if (location) query['location.country'] = location;

      // For company users, only show their jobs
      if (req.user?.role === UserRole.COMPANY) {
        filters.companyId = req.user.companyId;
      }

      // For public access, only show active and approved jobs
      if (!req.user || req.user.role === UserRole.AMBASSADOR) {
        filters.status = 'Active';
      }

      const options = {
        page: Number(page),
        limit: Number(limit),
        sort,
        populate: {
          path: 'companyId',
          select: 'name logo'
        }
      };

      const result = await JobService.getJobs(filters, options);

      res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    }
  );

  // Search jobs
  static searchJobs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { q, ...filters } = req.query;

      if (!q || typeof q !== 'string') {
        throw new BadRequestError('Search query is required', 400);
      }

      const validatedFilters = await validateJobFilters(filters);
      
      // For public access, only show active and approved jobs
      if (!req.user || req.user.role === UserRole.AMBASSADOR) {
        validatedFilters.status = 'Active';
      }

      const result = await JobService.searchJobs(q, validatedFilters);

      res.status(200).json({
        success: true,
        data: result.jobs,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    }
  );

  // Admin: Update job moderation status
  static updateModerationStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { status, reason } = req.body;

      if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        throw new BadRequestError('Invalid moderation status', 400);
      }

      const job = await JobService.updateModerationStatus(
        req.params.id,
        status,
        req.user.id,
        reason
      );

      res.status(200).json({
        success: true,
        data: job,
      });
    }
  );

  // Company: Update job status
  static updateJobStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { status } = req.body;

      if (!['Draft', 'Pending', 'Paused', 'Cancelled'].includes(status)) {
        throw new BadRequestError('Invalid status', 400);
      }

      const job = await JobService.updateJobStatus(
        req.params.id,
        status,
        req.user.companyId
      );

      res.status(200).json({
        success: true,
        data: job,
      });
    }
  );

  // Admin: Highlight job
  static highlightJob = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { highlight } = req.body;

      const job = await JobService.updateJob(
        req.params.id,
        {
          'metadata.isHighlighted': highlight,
          'metadata.lastActivityAt': new Date()
        },
        req.user.companyId
      );

      res.status(200).json({
        success: true,
        data: job,
      });
    }
  );
}

export default JobController;
