import express from 'express';
import { AmbassadorController } from '../controllers/AmbassadorController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.get('/public', AmbassadorController.getAmbassadors);
router.get('/public/:id', AmbassadorController.getAmbassadorById);

// Protected routes
router.use(authenticate);

// Ambassador routes
router.post(
  '/',
  authorize([UserRole.USER]),
  AmbassadorController.createAmbassador
);

router.get(
  '/me',
  authorize([UserRole.AMBASSADOR]),
  AmbassadorController.getAmbassadorById
);

router.patch(
  '/me',
  authorize([UserRole.AMBASSADOR]),
  AmbassadorController.updateAmbassador
);

// Admin routes
router.get(
  '/',
  authorize([UserRole.ADMIN]),
  AmbassadorController.getAmbassadors
);

router.get(
  '/:id',
  authorize([UserRole.ADMIN, UserRole.COMPANY]),
  AmbassadorController.getAmbassadorById
);

router.patch(
  '/:id',
  authorize([UserRole.ADMIN]),
  AmbassadorController.updateAmbassador
);

router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  AmbassadorController.deleteAmbassador
);

router.patch(
  '/:id/verification',
  authorize([UserRole.ADMIN]),
  AmbassadorController.updateVerificationStatus
);

router.post(
  '/:id/rating',
  authorize([UserRole.COMPANY]),
  AmbassadorController.updateRating
);

router.post(
  '/:id/completed-jobs',
  authorize([UserRole.ADMIN, UserRole.COMPANY]),
  AmbassadorController.incrementCompletedJobs
);

export default router;
