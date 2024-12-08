import { z } from 'zod';
import { AppError } from '../utils/errors';

const attachmentSchema = z.object({
  type: z.string(),
  url: z.string().url(),
  name: z.string(),
  size: z.number().positive(),
});

const locationSchema = z.object({
  type: z.enum(['Remote', 'On-site', 'Hybrid']),
  cities: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
}).refine(data => {
  if (data.type !== 'Remote' && (!data.cities?.length && !data.countries?.length)) {
    return false;
  }
  return true;
}, {
  message: "Cities or countries are required for on-site and hybrid positions",
});

const budgetSchema = z.object({
  range: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).refine(data => data.min <= data.max, {
    message: "Minimum budget cannot be greater than maximum budget",
  }),
  currency: z.string().default('USD'),
  type: z.enum(['Fixed', 'Hourly', 'Daily']),
  negotiable: z.boolean().default(false),
});

const durationSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional(),
  estimatedHours: z.number().positive().optional(),
  estimatedDays: z.number().positive().optional(),
}).refine(data => {
  if (data.endDate && data.startDate > data.endDate) {
    return false;
  }
  return true;
}, {
  message: "End date must be after start date",
});

export const jobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(100).max(5000),
  shortDescription: z.string().min(50).max(250),
  requirements: z.array(z.string()).min(1),
  responsibilities: z.array(z.string()).min(1),
  qualifications: z.object({
    required: z.array(z.string()),
    preferred: z.array(z.string()),
  }),
  category: z.array(z.string()).min(1),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'One-time']),
  location: locationSchema,
  budget: budgetSchema,
  duration: durationSchema,
  skills: z.array(z.string()).min(1),
  attachments: z.array(attachmentSchema).optional(),
  status: z.enum([
    'Draft',
    'Pending',
    'Active',
    'Paused',
    'Completed',
    'Cancelled',
    'Rejected'
  ]).default('Draft'),
  visibility: z.enum(['Public', 'Private', 'Featured']).default('Public'),
  applicationDeadline: z.string()
    .transform(str => new Date(str))
    .refine(date => date > new Date(), {
      message: "Application deadline must be in the future",
    })
    .optional(),
  maxApplications: z.number().positive().optional(),
  metadata: z.object({
    isUrgent: z.boolean().default(false),
    isHighlighted: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export const jobUpdateSchema = jobSchema.partial().extend({
  status: z.enum([
    'Draft',
    'Pending',
    'Active',
    'Paused',
    'Completed',
    'Cancelled',
    'Rejected'
  ]).optional(),
});

export const jobFilterSchema = z.object({
  category: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  location: z.enum(['Remote', 'On-site', 'Hybrid']).optional(),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'One-time']).optional(),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  status: z.enum([
    'Draft',
    'Pending',
    'Active',
    'Paused',
    'Completed',
    'Cancelled',
    'Rejected'
  ]).optional(),
  companyId: z.string().optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().optional(),
  sort: z.string().optional(),
});

export const validateJob = async (data: any, isUpdate = false) => {
  try {
    const schema = isUpdate ? jobUpdateSchema : jobSchema;
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        'Validation failed: ' + error.errors.map(e => e.message).join(', '),
        400
      );
    }
    throw error;
  }
};

export const validateJobFilters = async (data: any) => {
  try {
    return await jobFilterSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        'Invalid filter parameters: ' + error.errors.map(e => e.message).join(', '),
        400
      );
    }
    throw error;
  }
};
