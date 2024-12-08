import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/JobService';
import { validateJob, validateJobFilters } from '../validators/jobValidator';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../types';

export class JobController {
  // Create new job
  static createJob = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedData = await validateJob(req.body);
      const job = await JobService.createJob({
        ...validatedData,
        companyId: req.user.companyId,
      });
      
      res.status(201).json({
        success: true,
        data: job,
      });
    }
  );

  // Get job by ID
  static getJobById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const job = await JobService.getJobById(req.params.id);
      
      if (!job) {
        throw new AppError('Job not found', 404);
      }

      // Increment view count for public views
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        await JobService.incrementViewCount(req.params.id);
      }

      res.status(200).json({
        success: true,
        data: job,
      });
    }
  );

  // Update job
  static updateJob = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedData = await validateJob(req.body, true);
      
      // Only allow status updates for admin
      if (req.user.role !== UserRole.ADMIN) {
        delete validatedData.status;
        delete validatedData.moderationStatus;
      }

      const job = await JobService.updateJob(
        req.params.id,
        validatedData,
        req.user.companyId
      );

      res.status(200).json({
        success: true,
        data: job,
      });
    }
  );

  // Delete job
  static deleteJob = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      await JobService.deleteJob(req.params.id, req.user.companyId);

      res.status(204).json({
        success: true,
        data: null,
      });
    }
  );

  // Get all jobs with filtering
  static getJobs = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const filters = await validateJobFilters(req.query);

      // For company users, only show their jobs
      if (req.user?.role === UserRole.COMPANY) {
        filters.companyId = req.user.companyId;
      }

      // For public access, only show active and approved jobs
      if (!req.user || req.user.role === UserRole.AMBASSADOR) {
        filters.status = 'Active';
      }

      const result = await JobService.getJobs(filters);

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
        throw new AppError('Search query is required', 400);
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
        throw new AppError('Invalid moderation status', 400);
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
        throw new AppError('Invalid status', 400);
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
