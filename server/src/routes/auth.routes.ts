import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

// Register validation
const registerValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['HEALTHCARE_PROVIDER', 'FACILITY']).withMessage('Invalid role'),
];

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Password reset validation
const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

// Profile update validation
const updateProfileValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

// Email verification validation
const resendVerificationValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
];

// Routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post(
  '/forgot-password',
  forgotPasswordValidation,
  validateRequest,
  forgotPassword
);
router.post(
  '/reset-password',
  resetPasswordValidation,
  validateRequest,
  resetPassword
);
router.get('/verify-email/:token', verifyEmail);
router.post(
  '/resend-verification',
  resendVerificationValidation,
  validateRequest,
  resendVerification
);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, validateRequest, updateProfile);

export default router;
