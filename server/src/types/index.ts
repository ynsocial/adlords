import { Request } from 'express';
import { ObjectId } from 'mongodb';

export interface IUser {
  _id: ObjectId;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'company' | 'ambassador';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface IJob {
  _id: ObjectId;
  companyId: ObjectId;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'One-time';
  category: string[];
  status: 'Draft' | 'Pending' | 'Active' | 'Paused' | 'Completed' | 'Cancelled' | 'Rejected';
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: {
    required: string[];
    preferred: string[];
  };
  benefits: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    country?: string;
    city?: string;
    address?: string;
  };
  applicationDeadline: Date;
  startDate: Date;
  isAcceptingApplications: boolean;
  maxApplications: number;
  metadata: {
    views: number;
    applications: number;
    isHighlighted: boolean;
    isUrgent: boolean;
  };
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
  email: string;
  firstName: string;
  lastName: string;
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
