import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ApplicationStatus } from '../models/Application';

// Validation chains
export const applicationValidationRules = [
  body('coverLetter')
    .trim()
    .isLength({ min: 100, max: 5000 })
    .withMessage('Cover letter must be between 100 and 5000 characters'),

  body('expectedSalary')
    .optional()
    .isObject()
    .withMessage('Expected salary must be an object'),
  body('expectedSalary.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary amount must be a positive number'),
  body('expectedSalary.currency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('expectedSalary.period')
    .optional()
    .isIn(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .withMessage('Invalid salary period'),

  body('availability.startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('availability.noticePeriod')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Notice period must be a positive number'),

  body('experience.years')
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive number'),
  body('experience.relevantExperience')
    .trim()
    .isLength({ min: 50, max: 1000 })
    .withMessage('Relevant experience must be between 50 and 1000 characters'),

  body('questions.*.question')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Question cannot be empty'),
  body('questions.*.answer')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Answer cannot be empty'),
];

export const statusUpdateValidationRules = [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('status')
    .isIn(Object.values(ApplicationStatus))
    .withMessage('Invalid application status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

export const withdrawalValidationRules = [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('withdrawalReason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Withdrawal reason must be between 10 and 500 characters'),
];

// Validation middleware
export const validateApplication = [
  ...applicationValidationRules,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate file uploads
    if (!req.files?.resume) {
      return res.status(400).json({ 
        message: 'Resume file is required' 
      });
    }

    const resume = Array.isArray(req.files.resume) 
      ? req.files.resume[0] 
      : req.files.resume;

    // Check resume file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resume.mimetype)) {
      return res.status(400).json({ 
        message: 'Resume must be in PDF or Word format' 
      });
    }

    // Check resume file size (5MB limit)
    if (resume.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        message: 'Resume file size cannot exceed 5MB' 
      });
    }

    // Validate additional documents if present
    if (req.files?.additionalDocuments) {
      const docs = Array.isArray(req.files.additionalDocuments)
        ? req.files.additionalDocuments
        : [req.files.additionalDocuments];

      for (const doc of docs) {
        if (!allowedTypes.includes(doc.mimetype)) {
          return res.status(400).json({
            message: 'Additional documents must be in PDF or Word format'
          });
        }

        if (doc.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            message: 'Additional document size cannot exceed 5MB'
          });
        }
      }
    }

    next();
  }
];

export const validateStatusUpdate = [
  ...statusUpdateValidationRules,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateWithdrawal = [
  ...withdrawalValidationRules,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
