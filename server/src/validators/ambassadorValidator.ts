import { z } from 'zod';
import { AppError } from '../utils/errors';

const socialMediaSchema = z.object({
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  portfolio: z.string().url().optional(),
}).optional();

const experienceSchema = z.object({
  title: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  location: z.string().min(2).max(100),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  current: z.boolean().default(false),
  description: z.string().max(500).optional(),
});

const educationSchema = z.object({
  institution: z.string().min(2).max(100),
  degree: z.string().min(2).max(100),
  field: z.string().min(2).max(100),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  current: z.boolean().default(false),
});

const certificationSchema = z.object({
  name: z.string().min(2).max(100),
  issuer: z.string().min(2).max(100),
  issueDate: z.string().transform((str) => new Date(str)),
  expiryDate: z.string().transform((str) => new Date(str)).optional(),
  credentialId: z.string().optional(),
});

const languageSchema = z.object({
  language: z.string().min(2).max(50),
  proficiency: z.enum(['Basic', 'Intermediate', 'Advanced', 'Native']),
});

const availabilitySchema = z.object({
  status: z.enum(['Available', 'Partially Available', 'Not Available']).default('Available'),
  preferredLocations: z.array(z.string()).default([]),
  remoteWork: z.boolean().default(true),
  travelPreference: z.enum(['No Travel', 'Limited Travel', 'Frequent Travel']).default('Limited Travel'),
});

const documentSchema = z.object({
  type: z.enum(['Resume', 'Certificate', 'Other']),
  title: z.string().min(2).max(100),
  url: z.string().url(),
  uploadDate: z.date().default(() => new Date()),
});

export const ambassadorSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().min(2).max(50)).default([]),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  availability: availabilitySchema.optional(),
  socialMedia: socialMediaSchema,
  documents: z.array(documentSchema).optional(),
  status: z.enum(['Active', 'Inactive', 'Pending', 'Rejected']).default('Pending'),
  verificationStatus: z.enum(['Unverified', 'Pending', 'Verified', 'Rejected']).default('Unverified'),
});

export const validateAmbassador = async (data: any, isUpdate = false) => {
  try {
    const schema = isUpdate
      ? ambassadorSchema.partial() // Make all fields optional for updates
      : ambassadorSchema;

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
