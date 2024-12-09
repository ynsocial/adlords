import nodemailer from 'nodemailer';
import { logError, logInfo } from '../config/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      logInfo('Email sent successfully', { messageId: info.messageId, to });
      return true;
    } catch (error) {
      logError(error as Error, { context: 'EmailService.sendEmail', to });
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <p>Best regards,<br>Travel Health Team</p>
    `;
    return this.sendEmail(to, 'Password Reset Request', html);
  }

  async sendPasswordResetConfirmation(to: string) {
    const html = `
      <h1>Password Reset Successful</h1>
      <p>Your password has been successfully reset.</p>
      <p>If you did not perform this action, please contact our support team immediately.</p>
      <p>Best regards,<br>Travel Health Team</p>
    `;
    return this.sendEmail(to, 'Password Reset Successful', html);
  }

  async sendVerificationEmail(to: string, verificationToken: string) {
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    const html = `
      <h1>Verify Your Email</h1>
      <p>Thank you for registering with Travel Health. Please click the link below to verify your email address:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>Travel Health Team</p>
    `;
    return this.sendEmail(to, 'Verify Your Email', html);
  }

  async sendPasswordChangeConfirmation(
    to: string,
    firstName: string
  ): Promise<void> {
    const mailOptions = {
      from: `"Travel Health" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${firstName},</h2>
          <p>Your password has been successfully changed.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>Travel Health Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logInfo(`Password change confirmation email sent to ${to}`);
    } catch (error) {
      logError('Error sending password change confirmation email:', error);
      throw new Error('Failed to send password change confirmation email');
    }
  }

  async sendVerificationSuccessEmail(
    to: string,
    firstName: string
  ): Promise<void> {
    const mailOptions = {
      from: `"Travel Health" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Email Verification Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${firstName},</h2>
          <p>Your email has been successfully verified!</p>
          <p>You can now access all features of Travel Health.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          <p>Best regards,<br>Travel Health Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logInfo(`Verification success email sent to ${to}`);
    } catch (error) {
      logError('Error sending verification success email:', error);
      throw new Error('Failed to send verification success email');
    }
  }

  async sendApplicationStatusEmail(
    to: string,
    firstName: string,
    jobTitle: string,
    status: string
  ): Promise<void> {
    const statusMessages = {
      PENDING: 'We have received your application',
      REVIEWING: 'Your application is now under review',
      SHORTLISTED: 'Congratulations! You have been shortlisted',
      INTERVIEW: 'You have been selected for an interview',
      ACCEPTED: 'Congratulations! Your application has been accepted',
      REJECTED: 'Update on your application',
      WITHDRAWN: 'Application withdrawal confirmation',
    };

    const statusDetails = {
      PENDING: 'We will review your application and get back to you soon.',
      REVIEWING: 'Our team is currently reviewing your application. We will update you on any developments.',
      SHORTLISTED: 'Your application has been shortlisted for further consideration. We will contact you soon with next steps.',
      INTERVIEW: 'We would like to invite you for an interview. You will receive a separate email with the details.',
      ACCEPTED: 'We are pleased to inform you that your application has been successful. You will receive further details shortly.',
      REJECTED: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.',
      WITHDRAWN: 'Your application has been successfully withdrawn as requested.',
    };

    const mailOptions = {
      from: `"Travel Health" <${process.env.EMAIL_FROM}>`,
      to,
      subject: `${statusMessages[status]} - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${firstName},</h2>
          <p>Re: Your application for <strong>${jobTitle}</strong></p>
          <p>${statusDetails[status]}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/applications" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              View Application Status
            </a>
          </div>
          <p>Best regards,<br>Travel Health Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logInfo(`Application status email sent to ${to} - Status: ${status}`);
    } catch (error) {
      logError('Error sending application status email:', error);
      throw new Error('Failed to send application status email');
    }
  }

  async sendInterviewScheduleEmail(
    to: string,
    firstName: string,
    jobTitle: string,
    interviewDetails: {
      date: Date;
      type: string;
      location?: string;
      meetingLink?: string;
    }
  ): Promise<void> {
    const interviewType = interviewDetails.type.replace('_', ' ').toLowerCase();
    const locationInfo = interviewDetails.type === 'IN_PERSON' 
      ? `<p><strong>Location:</strong> ${interviewDetails.location}</p>`
      : interviewDetails.type === 'VIDEO'
      ? `<p><strong>Meeting Link:</strong> ${interviewDetails.meetingLink}</p>`
      : '';

    const mailOptions = {
      from: `"Travel Health" <${process.env.EMAIL_FROM}>`,
      to,
      subject: `Interview Scheduled - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${firstName},</h2>
          <p>Your interview for the position of <strong>${jobTitle}</strong> has been scheduled.</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Date & Time:</strong> ${interviewDetails.date.toLocaleString()}</p>
            <p><strong>Interview Type:</strong> ${interviewType}</p>
            ${locationInfo}
          </div>
          <p>Please make sure to:</p>
          <ul>
            <li>Review the job description and your application</li>
            <li>Prepare any relevant documents or portfolio</li>
            <li>Test your equipment if it's a video interview</li>
            <li>Arrive 10 minutes early</li>
          </ul>
          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/applications" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              View Interview Details
            </a>
          </div>
          <p>Best regards,<br>Travel Health Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logInfo(`Interview schedule email sent to ${to}`);
    } catch (error) {
      logError('Error sending interview schedule email:', error);
      throw new Error('Failed to send interview schedule email');
    }
  }

  async sendInterviewReminderEmail(
    to: string,
    firstName: string,
    jobTitle: string,
    interviewDetails: {
      date: Date;
      type: string;
      location?: string;
      meetingLink?: string;
    }
  ): Promise<void> {
    const interviewType = interviewDetails.type.replace('_', ' ').toLowerCase();
    const locationInfo = interviewDetails.type === 'IN_PERSON' 
      ? `<p><strong>Location:</strong> ${interviewDetails.location}</p>`
      : interviewDetails.type === 'VIDEO'
      ? `<p><strong>Meeting Link:</strong> ${interviewDetails.meetingLink}</p>`
      : '';

    const mailOptions = {
      from: `"Travel Health" <${process.env.EMAIL_FROM}>`,
      to,
      subject: `Interview Reminder - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${firstName},</h2>
          <p>This is a reminder about your upcoming interview for the position of <strong>${jobTitle}</strong>.</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Date & Time:</strong> ${interviewDetails.date.toLocaleString()}</p>
            <p><strong>Interview Type:</strong> ${interviewType}</p>
            ${locationInfo}
          </div>
          <p>Remember to:</p>
          <ul>
            <li>Have your ID ready</li>
            <li>Bring any requested documents</li>
            <li>Test your equipment if it's a video interview</li>
            <li>Arrive 10 minutes early</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/applications" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              View Interview Details
            </a>
          </div>
          <p>Best regards,<br>Travel Health Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logInfo(`Interview reminder email sent to ${to}`);
    } catch (error) {
      logError('Error sending interview reminder email:', error);
      throw new Error('Failed to send interview reminder email');
    }
  }
}

// Create singleton instance
let instance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!instance) {
    instance = new EmailService();
  }
  return instance;
};
