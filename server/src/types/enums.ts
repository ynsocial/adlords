export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  COMPANY = 'company',
  AMBASSADOR = 'ambassador'
}

export enum CompanyStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export enum JobStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export enum NotificationType {
  JOB_POSTED = 'job_posted',
  APPLICATION_SUBMITTED = 'application_submitted',
  APPLICATION_STATUS_CHANGED = 'application_status_changed',
  COMPANY_VERIFIED = 'company_verified',
  COMPANY_REJECTED = 'company_rejected',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed'
}

export enum EmailTemplate {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  APPLICATION_STATUS = 'application_status',
  JOB_APPLICATION = 'job_application',
  COMPANY_VERIFICATION = 'company_verification'
}

export interface EmailData {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}
