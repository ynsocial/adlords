import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import PasswordReset from '../models/PasswordReset';
import { getEmailService } from '../services/EmailService';
import { generateToken } from '../utils/jwt';
import { logError, logInfo } from '../config/logger';
import { AuthenticatedRequest } from '../types/express';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      verificationToken,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await user.save();

    // Send verification email
    await getEmailService().sendVerificationEmail(email, verificationToken);

    logInfo('User registered successfully', { userId: user._id });
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    logError(error as Error, { context: 'register' });
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    logInfo('User logged in successfully', { userId: user._id });
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    logError(error as Error, { context: 'login' });
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    const passwordReset = new PasswordReset({
      userId: user._id,
      token: resetToken,
      expiresAt
    });
    await passwordReset.save();

    // Send reset email
    await getEmailService().sendPasswordResetEmail(email, resetToken);

    logInfo('Password reset email sent', { userId: user._id });
    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    logError(error as Error, { context: 'forgotPassword' });
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Find valid reset token
    const passwordReset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find user
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Delete reset token
    await PasswordReset.deleteOne({ _id: passwordReset._id });

    // Send confirmation email
    await getEmailService().sendPasswordResetConfirmation(user.email);

    logInfo('Password reset successful', { userId: user._id });
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    logError(error as Error, { context: 'resetPassword' });
    res.status(500).json({ message: 'Error resetting password' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Send confirmation email
    await getEmailService().sendVerificationSuccessEmail(user.email, user.firstName);

    logInfo('Email verification successful', { userId: user._id });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logError(error as Error, { context: 'verifyEmail' });
    res.status(500).json({ message: 'Error verifying email' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Send confirmation email
    await getEmailService().sendPasswordChangeConfirmation(user.email, user.firstName);

    logInfo('Password changed successfully', { userId: user._id });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logError(error as Error, { context: 'changePassword' });
    res.status(500).json({ message: 'Error changing password' });
  }
};
