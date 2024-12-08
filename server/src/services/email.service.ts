import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { EmailTemplate, EmailData } from '../types';
import config from '../config';

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
    const templates: EmailTemplate[] = [
      'company-registration',
      'company-approval',
      'company-rejection',
      'job-posting-approval',
      'job-posting-rejection',
      'application-received',
      'application-status-update',
      'verification-code',
      'password-reset',
    ];

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
    await this.sendEmail(email, 'Verify Your Account', 'verification-code', {
      code,
      expiresIn: '15 minutes',
    });
  }

  async sendCompanyRegistrationConfirmation(email: string, companyName: string) {
    await this.sendEmail(
      email,
      'Welcome to Travel Health Ambassador Platform',
      'company-registration',
      {
        companyName,
        loginUrl: `${config.clientUrl}/login`,
      }
    );
  }

  async sendCompanyApproval(email: string, companyName: string, comment?: string) {
    await this.sendEmail(
      email,
      'Your Company Registration Has Been Approved',
      'company-approval',
      {
        companyName,
        comment,
        dashboardUrl: `${config.clientUrl}/company/dashboard`,
      }
    );
  }

  async sendCompanyRejection(email: string, companyName: string, comment?: string) {
    await this.sendEmail(
      email,
      'Your Company Registration Status',
      'company-rejection',
      {
        companyName,
        comment,
        supportEmail: config.email.supportAddress,
      }
    );
  }

  // Job Posting Notifications
  async sendJobPostingApproval(
    email: string,
    companyName: string,
    jobTitle: string,
    comment?: string
  ) {
    await this.sendEmail(
      email,
      'Your Job Posting Has Been Approved',
      'job-posting-approval',
      {
        companyName,
        jobTitle,
        comment,
        jobUrl: `${config.clientUrl}/jobs/${jobTitle}`,
      }
    );
  }

  async sendJobPostingRejection(
    email: string,
    companyName: string,
    jobTitle: string,
    comment?: string
  ) {
    await this.sendEmail(
      email,
      'Your Job Posting Requires Updates',
      'job-posting-rejection',
      {
        companyName,
        jobTitle,
        comment,
        editUrl: `${config.clientUrl}/company/jobs/edit`,
      }
    );
  }

  // Application Notifications
  async sendApplicationReceived(
    companyEmail: string,
    applicantName: string,
    jobTitle: string
  ) {
    await this.sendEmail(
      companyEmail,
      'New Application Received',
      'application-received',
      {
        applicantName,
        jobTitle,
        applicationUrl: `${config.clientUrl}/company/applications`,
      }
    );
  }

  async sendApplicationStatusUpdate(
    applicantEmail: string,
    jobTitle: string,
    status: string,
    comment?: string
  ) {
    await this.sendEmail(
      applicantEmail,
      'Your Application Status Has Been Updated',
      'application-status-update',
      {
        jobTitle,
        status,
        comment,
        dashboardUrl: `${config.clientUrl}/dashboard`,
      }
    );
  }

  // Password Reset
  async sendPasswordResetLink(email: string, resetToken: string) {
    await this.sendEmail(email, 'Reset Your Password', 'password-reset', {
      resetUrl: `${config.clientUrl}/reset-password?token=${resetToken}`,
      expiresIn: '1 hour',
    });
  }

  // Bulk Emails
  async sendBulkEmails(
    recipients: { email: string; data: EmailData }[],
    template: EmailTemplate,
    subject: string
  ) {
    const promises = recipients.map((recipient) =>
      this.sendEmail(recipient.email, subject, template, recipient.data)
    );

    try {
      await Promise.all(promises);
      console.log(`Bulk emails sent successfully to ${recipients.length} recipients`);
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
