import express from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import {
  registerCompany,
  verifyCompany,
  updateCompanyStatus,
  getCompanies,
  getCompanyById,
  createJob,
  updateJob,
  deleteJob,
  getJobs,
  getJobById,
  updateJobStatus,
} from '../controllers/company.controller';
import { validateRequest, authenticate, authorize } from '../middleware';
import { CompanyStatus, JobStatus } from '../types';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Company Registration Routes
router.post(
  '/register',
  [
    body('companyName').trim().isLength({ min: 2 }).escape(),
    body('contactName').trim().isLength({ min: 2 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  ],
  validateRequest,
  registerCompany
);

router.post(
  '/verify',
  [
    body('code').isString().isLength({ min: 6, max: 6 }),
    body('method').isIn(['email', 'phone']),
    body('destination').isString(),
  ],
  validateRequest,
  verifyCompany
);

// Company Management Routes (Admin Only)
router.get(
  '/companies',
  authenticate,
  authorize(['admin']),
  getCompanies
);

router.get(
  '/companies/:id',
  authenticate,
  authorize(['admin']),
  [param('id').isMongoId()],
  validateRequest,
  getCompanyById
);

router.patch(
  '/companies/:id/status',
  authenticate,
  authorize(['admin']),
  [
    param('id').isMongoId(),
    body('status').isIn(['approved', 'rejected']),
    body('comment').optional().isString(),
  ],
  validateRequest,
  updateCompanyStatus
);

// Job Posting Routes
router.post(
  '/jobs',
  authenticate,
  authorize(['company']),
  upload.single('photo'),
  [
    body('title').trim().isLength({ min: 10, max: 100 }).escape(),
    body('budget').isFloat({ min: 0 }),
    body('description').trim().isLength({ min: 100 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('location.type').isIn(['remote', 'physical']),
    body('location.address').if(body('location.type').equals('physical')).notEmpty(),
    body('requirements').isArray(),
    body('skills').isArray(),
  ],
  validateRequest,
  createJob
);

router.get(
  '/jobs',
  authenticate,
  getJobs
);

router.get(
  '/jobs/:id',
  authenticate,
  [param('id').isMongoId()],
  validateRequest,
  getJobById
);

router.patch(
  '/jobs/:id',
  authenticate,
  authorize(['company']),
  upload.single('photo'),
  [
    param('id').isMongoId(),
    body('title').optional().trim().isLength({ min: 10, max: 100 }).escape(),
    body('budget').optional().isFloat({ min: 0 }),
    body('description').optional().trim().isLength({ min: 100 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('location.type').optional().isIn(['remote', 'physical']),
    body('location.address').if(body('location.type').equals('physical')).notEmpty(),
    body('requirements').optional().isArray(),
    body('skills').optional().isArray(),
  ],
  validateRequest,
  updateJob
);

router.delete(
  '/jobs/:id',
  authenticate,
  authorize(['company']),
  [param('id').isMongoId()],
  validateRequest,
  deleteJob
);

router.patch(
  '/jobs/:id/status',
  authenticate,
  authorize(['admin']),
  [
    param('id').isMongoId(),
    body('status').isIn(['pending', 'approved', 'rejected']),
    body('comment').optional().isString(),
  ],
  validateRequest,
  updateJobStatus
);

export default router;
