import { Request } from 'express';
import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'ambassador';
  isActive: boolean;
  lastLogin: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export enum EmailTemplate {
  COMPANY_REGISTRATION = 'company-registration',
  COMPANY_APPROVAL = 'company-approval',
  COMPANY_REJECTION = 'company-rejection',
  JOB_POSTING_APPROVAL = 'job-posting-approval',
  JOB_POSTING_REJECTION = 'job-posting-rejection',
  APPLICATION_RECEIVED = 'application-received',
  APPLICATION_STATUS_UPDATE = 'application-status-update',
  VERIFICATION_CODE = 'verification-code',
  PASSWORD_RESET = 'password-reset'
}

export interface EmailData {
  [key: string]: any;
}

export interface IAttachment {
  type: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface IJob {
  _id: ObjectId;
  companyId: ObjectId;
  title: string;
  description: string;
  shortDescription?: string;
  requirements: string[];
  responsibilities: string[];
  category: string[];
  type: 'Full-time' | 'Part-time' | 'Contract' | 'One-time';
  location: {
    type: 'Remote' | 'On-site' | 'Hybrid';
    cities?: string[];
    countries?: string[];
  };
  budget: {
    range: {
      min: number;
      max: number;
    };
    currency: string;
    type: 'Fixed' | 'Hourly' | 'Daily';
    negotiable: boolean;
  };
  duration?: {
    type: 'Fixed' | 'Ongoing';
    startDate?: Date;
    endDate?: Date;
    estimatedMonths?: number;
  };
  skills: string[];
  benefits?: string[];
  status: 'Draft' | 'Pending' | 'Active' | 'Paused' | 'Cancelled' | 'Completed';
  metadata: {
    views: number;
    applications: number;
    isHighlighted: boolean;
    isUrgent: boolean;
  };
  attachments?: IAttachment[];
  maxApplications?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApplication {
  _id: ObjectId;
  jobId: ObjectId;
  applicantId: ObjectId;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Shortlisted' | 'Interview' | 'Offer' | 'Accepted' | 'Rejected' | 'Withdrawn';
  coverLetter: string;
  resume: {
    url: string;
    name: string;
  };
  additionalDocuments?: {
    url: string;
    name: string;
    type: string;
  }[];
  feedback?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
  interview?: {
    scheduledAt: Date;
    location: string;
    notes: string;
  };
  statusHistory: {
    status: string;
    note: string;
    modifiedBy: ObjectId;
    modifiedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAmbassador {
  _id: ObjectId;
  userId: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  socialMedia: {
    twitter?: string;
    linkedin?: string;
    portfolio?: string;
  };
  status: 'Pending' | 'Active' | 'Rejected' | 'Inactive';
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
  }[];
  education: {
    degree: string;
    institution: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
  }[];
  skills: string[];
  languages: {
    language: string;
    proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Native';
  }[];
  certifications: {
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    url?: string;
  }[];
  verificationStatus: 'Pending' | 'In Progress' | 'Verified';
  verificationDocuments?: {
    type: string;
    url: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompany {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  industry: string[];
  size: 'Startup' | 'Small' | 'Medium' | 'Large' | 'Enterprise';
  founded?: Date;
  headquarters: {
    country: string;
    city: string;
    address?: string;
  };
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  contact: {
    email: string;
    phone?: string;
    name: string;
    position: string;
  };
  status: 'Pending' | 'Active' | 'Inactive' | 'Blocked';
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  verificationDocuments?: {
    type: string;
    url: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    note?: string;
  }[];
  metadata: {
    jobsPosted: number;
    activeJobs: number;
    totalApplications: number;
    rating: number;
    reviews: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: ObjectId;
  userId: ObjectId;
  action: string;
  entityType: 'job' | 'application' | 'company' | 'ambassador' | 'user';
  entityId: ObjectId;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface ITask {
  _id: ObjectId;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: Record<string, any>;
  result?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export * from './enums';
