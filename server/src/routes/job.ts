import express from 'express';
import { JobController } from '../controllers/JobController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';
import { validateRequest } from '../middleware/validateRequest';
import { jobSchema, jobUpdateSchema } from '../validators/jobValidator';

const router = express.Router();

// Public routes
router.get('/', JobController.getJobs);
router.get('/search', JobController.searchJobs);
router.get('/:id', JobController.getJobById);

// Protected routes
router.use(authenticate);

// Company routes
router.post(
  '/',
  authorize([UserRole.COMPANY]),
  validateRequest(jobSchema),
  JobController.createJob
);

router.get(
  '/company/jobs',
  authorize([UserRole.COMPANY]),
  JobController.getJobs
);

router.patch(
  '/:id',
  authorize([UserRole.COMPANY]),
  validateRequest(jobUpdateSchema),
  JobController.updateJob
);

router.delete(
  '/:id',
  authorize([UserRole.COMPANY]),
  JobController.deleteJob
);

router.patch(
  '/:id/status',
  authorize([UserRole.COMPANY]),
  JobController.updateJobStatus
);

// Admin routes
router.get(
  '/admin/jobs',
  authorize([UserRole.ADMIN]),
  JobController.getJobs
);

router.patch(
  '/:id/moderation',
  authorize([UserRole.ADMIN]),
  JobController.updateModerationStatus
);

router.patch(
  '/:id/highlight',
  authorize([UserRole.ADMIN]),
  JobController.highlightJob
);

export default router;
