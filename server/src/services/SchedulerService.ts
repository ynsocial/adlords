import { CronJob } from 'cron';
import { Application, ApplicationStatus } from '../models/Application';
import { emailService } from './emailService';
import { logger } from '../config/logger';

class SchedulerService {
  private interviewReminderJob: CronJob;
  private applicationCleanupJob: CronJob;

  constructor() {
    // Run interview reminders every hour
    this.interviewReminderJob = new CronJob('0 * * * *', this.sendInterviewReminders);

    // Run application cleanup at midnight every day
    this.applicationCleanupJob = new CronJob('0 0 * * *', this.cleanupOldApplications);
  }

  start(): void {
    this.interviewReminderJob.start();
    this.applicationCleanupJob.start();
    logger.info('Scheduler service started');
  }

  stop(): void {
    this.interviewReminderJob.stop();
    this.applicationCleanupJob.stop();
    logger.info('Scheduler service stopped');
  }

  private async sendInterviewReminders(): Promise<void> {
    try {
      const reminderHours = parseInt(process.env.INTERVIEW_REMINDER_HOURS || '24', 10);
      const now = new Date();
      const reminderTime = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);

      // Find applications with upcoming interviews
      const applications = await Application.find({
        status: ApplicationStatus.INTERVIEW,
        'interviews.scheduledFor': {
          $gt: now,
          $lt: reminderTime,
        },
        'interviews.status': 'SCHEDULED',
      }).populate({
        path: 'applicant',
        select: 'email name'
      }).populate({
        path: 'job',
        select: 'title'
      });

      for (const application of applications) {
        const upcomingInterview = application.interviews?.find(
          interview => 
            interview.scheduledFor > now && 
            interview.scheduledFor < reminderTime &&
            interview.status === 'SCHEDULED'
        );

        if (upcomingInterview && application.applicant?.email) {
          await emailService.sendInterviewReminderEmail(
            application.applicant.email,
            application.applicant.name,
            application.job.title,
            {
              date: upcomingInterview.scheduledFor,
              type: upcomingInterview.type,
              location: upcomingInterview.location,
              meetingLink: upcomingInterview.location, // For video interviews, location stores the meeting link
            }
          );
        }
      }

      logger.info(`Sent interview reminders for ${applications.length} applications`);
    } catch (error) {
      logger.error('Error sending interview reminders:', error);
    }
  }

  private async cleanupOldApplications(): Promise<void> {
    try {
      const expiryDays = parseInt(process.env.APPLICATION_EXPIRY_DAYS || '30', 10);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - expiryDays);

      // Find expired applications
      const expiredApplications = await Application.find({
        status: ApplicationStatus.PENDING,
        createdAt: { $lt: expiryDate },
      }).populate({
        path: 'applicant',
        select: 'email name'
      }).populate({
        path: 'job',
        select: 'title employer'
      });

      // Update status to EXPIRED
      for (const application of expiredApplications) {
        application.status = ApplicationStatus.REJECTED;
        application.statusHistory.push({
          status: ApplicationStatus.REJECTED,
          timestamp: new Date(),
          updatedBy: application.job.employer,
          notes: `Application automatically rejected after ${expiryDays} days of inactivity`,
        });

        await application.save();

        // Send notification to applicant
        if (application.applicant?.email) {
          await emailService.sendApplicationStatusEmail(
            application.applicant.email,
            application.applicant.name,
            application.job.title,
            ApplicationStatus.REJECTED
          );
        }
      }

      logger.info(`Cleaned up ${expiredApplications.length} expired applications`);
    } catch (error) {
      logger.error('Error cleaning up old applications:', error);
    }
  }
}

export const schedulerService = new SchedulerService();
