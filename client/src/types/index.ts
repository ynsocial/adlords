import { Permission } from '../utils/permissions';

export type UserRole = 'admin' | 'company' | 'ambassador' | 'guest';
export type JobStatus = 'draft' | 'pending' | 'approved' | 'highlighted' | 'rejected' | 'archived';
export type CompanyStatus = 'pending' | 'approved' | 'rejected';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  description: string;
  industry: string;
  location: string;
  status: CompanyStatus;
  contactEmail: string;
  contactPhone?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  subtitle?: string;
  description: string;
  requirements: string[];
  tags: string[];
  categories: string[];
  bonus?: string;
  deadline: string;
  budget: {
    hours: number;
    rate: number;
  };
  location: {
    type: 'remote' | 'in-person' | 'hybrid';
    address?: string;
  };
  imageUrl?: string;
  status: JobStatus;
  metrics: {
    views: number;
    applications: number;
    hires: number;
  };
  highlighted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  ambassadorId: string;
  coverLetter: string;
  status: ApplicationStatus;
  feedback?: string;
  rating?: number;
  earnings?: number;
  hoursWorked?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AmbassadorProfile {
  userId: string;
  bio: string;
  specialties: string[];
  experience: string;
  languages: string[];
  education?: string;
  certifications?: string[];
  availability: {
    hours: number;
    timezone: string;
  };
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  metrics: {
    totalApplications: number;
    totalEarnings: number;
    completedTasks: number;
    averageRating: number;
    hoursWorked: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  jobId: string;
  ambassadorId: string;
  title: string;
  description: string;
  deliverables: string[];
  deadline: string;
  status: TaskStatus;
  hours: number;
  payment: {
    amount: number;
    status: 'pending' | 'paid';
    paidAt?: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    givenAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  overview: {
    totalUsers: number;
    totalCompanies: number;
    totalJobs: number;
    totalApplications: number;
    totalTasks: number;
    activeJobs: number;
  };
  jobMetrics: {
    applicationsPerJob: number;
    averageHiringRate: number;
    topCategories: Array<{
      category: string;
      count: number;
    }>;
  };
  companyMetrics: {
    activeCompanies: number;
    averageJobsPerCompany: number;
    topIndustries: Array<{
      industry: string;
      count: number;
    }>;
  };
  ambassadorMetrics: {
    activeAmbassadors: number;
    averageEarnings: number;
    topPerformers: Array<{
      ambassadorId: string;
      name: string;
      earnings: number;
      completedTasks: number;
    }>;
  };
  timeline: Array<{
    date: string;
    jobs: number;
    applications: number;
    tasks: number;
  }>;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  search?: string;
  status?: string[];
  categories?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  location?: string;
  budget?: {
    min?: number;
    max?: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}
