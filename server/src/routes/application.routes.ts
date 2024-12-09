import express from 'express';
import { 
  createApplication,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationsByJob,
  getMyApplications
} from '../controllers/application.controller';
import { authenticate } from '../middleware/auth';
import { validateApplication } from '../middleware/validation';
import { upload } from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create new application
router.post(
  '/:jobId',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'additionalDocuments', maxCount: 5 }
  ]),
  validateApplication,
  createApplication
);

// Get specific application
router.get('/:id', getApplicationById);

// Update application status (employer only)
router.patch('/:id/status', updateApplicationStatus);

// Withdraw application (applicant only)
router.patch('/:id/withdraw', withdrawApplication);

// Get all applications for a specific job (employer only)
router.get('/job/:jobId', getApplicationsByJob);

// Get all applications for the logged-in user
router.get('/my/applications', getMyApplications);

export default router;
