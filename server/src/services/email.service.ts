import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { EmailTemplate, EmailData } from '../types';
import { config } from '../config';

class EmailService {
  private transporter: nodemailer.Transporter;
  private sesClient: SESClient;
  private templates: Map<EmailTemplate, HandlebarsTemplateDelegate>;

  constructor() {
    // Initialize AWS SES client
    this.sesClient = new SESClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });

    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      SES: { ses: this.sesClient, aws: { SendEmailCommand } },
    });

    // Load email templates
    this.templates = new Map();
    this.loadTemplates();
  }

  private loadTemplates() {
    const templateDir = path.join(__dirname, '../templates/email');
    const templates = Object.values(EmailTemplate);

    templates.forEach((templateName) => {
      const templatePath = path.join(templateDir, `${templateName}.hbs`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.templates.set(templateName, handlebars.compile(templateContent));
    });
  }

  private async sendEmail(
    to: string,
    subject: string,
    template: EmailTemplate,
    data: EmailData
  ) {
    try {
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new Error(`Template ${template} not found`);
      }

      const html = templateFn(data);

      const mailOptions = {
        from: config.email.fromAddress,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);

      // Log email sent
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // Company Registration and Verification
  async sendVerificationCode(email: string, code: string) {
    await this.sendEmail(email, 'Verify Your Account', EmailTemplate.VERIFICATION_CODE, {
      code,
      expiresIn: '15 minutes',
    });
  }

  async sendCompanyRegistrationConfirmation(email: string, companyName: string) {
    await this.sendEmail(
      email,
      'Welcome to Travel Health Ambassador Platform',
      EmailTemplate.COMPANY_REGISTRATION,
      {
        companyName,
        loginUrl: `${config.clientUrl}/login`,
      }
    );
  }

  async sendCompanyApprovalNotification(email: string, companyName: string) {
    await this.sendEmail(
      email,
      'Your Company Registration Has Been Approved',
      EmailTemplate.COMPANY_APPROVAL,
      {
        companyName,
        loginUrl: `${config.clientUrl}/login`,
      }
    );
  }

  async sendCompanyRejectionNotification(email: string, companyName: string, reason: string) {
    await this.sendEmail(
      email,
      'Your Company Registration Status',
      EmailTemplate.COMPANY_REJECTION,
      {
        companyName,
        reason,
        supportEmail: config.email.supportAddress,
      }
    );
  }

  // Job Posting Notifications
  async sendJobPostingApprovalNotification(email: string, jobTitle: string) {
    await this.sendEmail(
      email,
      'Your Job Posting Has Been Approved',
      EmailTemplate.JOB_POSTING_APPROVAL,
      {
        jobTitle,
        jobsUrl: `${config.clientUrl}/jobs`,
      }
    );
  }

  async sendJobPostingRejectionNotification(
    email: string,
    jobTitle: string,
    reason: string
  ) {
    await this.sendEmail(
      email,
      'Your Job Posting Status',
      EmailTemplate.JOB_POSTING_REJECTION,
      {
        jobTitle,
        reason,
        supportEmail: config.email.supportAddress,
      }
    );
  }

  // Application Notifications
  async sendApplicationReceivedNotification(
    email: string,
    jobTitle: string,
    companyName: string
  ) {
    await this.sendEmail(
      email,
      'Application Received',
      EmailTemplate.APPLICATION_RECEIVED,
      {
        jobTitle,
        companyName,
        applicationsUrl: `${config.clientUrl}/applications`,
      }
    );
  }

  async sendApplicationStatusUpdateNotification(
    email: string,
    jobTitle: string,
    status: string,
    message?: string
  ) {
    await this.sendEmail(
      email,
      'Application Status Update',
      EmailTemplate.APPLICATION_STATUS_UPDATE,
      {
        jobTitle,
        status,
        message,
        applicationsUrl: `${config.clientUrl}/applications`,
      }
    );
  }

  // Password Reset
  async sendPasswordResetEmail(email: string, resetToken: string) {
    await this.sendEmail(email, 'Reset Your Password', EmailTemplate.PASSWORD_RESET, {
      resetUrl: `${config.clientUrl}/reset-password?token=${resetToken}`,
      expiresIn: '1 hour',
    });
  }
}

export const emailService = new EmailService();
