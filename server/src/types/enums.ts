export enum UserRole {
  ADMIN = 'admin',
  COMPANY = 'company',
  AMBASSADOR = 'ambassador'
}

export enum CompanyStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended'
}

export enum JobStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed'
}

export enum NotificationType {
  JOB_APPLICATION = 'job_application',
  APPLICATION_STATUS = 'application_status',
  COMPANY_STATUS = 'company_status',
  JOB_STATUS = 'job_status'
}

export enum JobType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
  ONE_TIME = 'One-time'
}

export enum LocationType {
  REMOTE = 'Remote',
  ONSITE = 'On-site',
  HYBRID = 'Hybrid'
}

export enum BudgetType {
  FIXED = 'Fixed',
  HOURLY = 'Hourly',
  DAILY = 'Daily'
}

export enum ApplicationStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  SHORTLISTED = 'Shortlisted',
  REJECTED = 'Rejected',
  ACCEPTED = 'Accepted',
  WITHDRAWN = 'Withdrawn'
}

export enum EventType {
  APPLICATION_CREATED = 'application_created',
  APPLICATION_UPDATED = 'application_updated',
  JOB_CREATED = 'job_created',
  JOB_UPDATED = 'job_updated',
  NOTIFICATION_CREATED = 'notification_created'
}

export interface EmailData {
  to: string;
  subject: string;
  template: any;
  data: Record<string, any>;
}
