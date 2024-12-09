import nodemailer from 'nodemailer';
import config from '../config/config';
import { logger } from '../config/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    firstName: string
  ): Promise<void> {
    const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Travel Health" <${config.email.from}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${firstName},</h2>
          <p>You recently requested to reset your password for your Travel Health account.</p>
          <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>Travel Health Team</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${resetUrl}
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendPasswordChangeConfirmation(
    to: string,
    firstName: string
  ): Promise<void> {
    const mailOptions = {
      from: `"Travel Health" <${config.email.from}>`,
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
      logger.info(`Password change confirmation email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending password change confirmation email:', error);
      throw new Error('Failed to send password change confirmation email');
    }
  }

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    firstName: string
  ): Promise<void> {
    const verifyUrl = `${config.clientUrl}/verify-email/${verificationToken}`;

    const mailOptions = {
      from: `"Travel Health" <${config.email.from}>`,
      to,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Travel Health, ${firstName}!</h2>
          <p>Thank you for registering. Please verify your email address to complete your registration.</p>
          <p>This link will expire in 24 hours.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <p>Best regards,<br>Travel Health Team</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${verifyUrl}
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendVerificationSuccessEmail(
    to: string,
    firstName: string
  ): Promise<void> {
    const mailOptions = {
      from: `"Travel Health" <${config.email.from}>`,
      to,
      subject: 'Email Verification Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${firstName},</h2>
          <p>Your email has been successfully verified!</p>
          <p>You can now access all features of Travel Health.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.clientUrl}/login" 
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
      logger.info(`Verification success email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending verification success email:', error);
      throw new Error('Failed to send verification success email');
    }
  }
}

export const emailService = new EmailService();
