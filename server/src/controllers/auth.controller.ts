import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { logger } from '../config/logger';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import emailService from '../services/emailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(verificationToken, 10);

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      verificationToken: hash,
      verificationExpires: new Date(Date.now() + 86400000), // 24 hours
    });

    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName
    );

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    logger.error('Error in register:', error);
    res.status(500).json({
      message: 'Error creating user',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in'
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching profile'
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { firstName, lastName },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(resetToken, 10);

    // Save reset token to user
    user.resetPasswordToken = hash;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName
    );

    res.status(200).json({
      message: 'Password reset email sent',
    });
  } catch (error) {
    logger.error('Error in forgotPassword:', error);
    res.status(500).json({
      message: 'Error sending password reset email',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: { $exists: true },
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset token is invalid or has expired',
      });
    }

    // Verify reset token
    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValidToken) {
      return res.status(400).json({
        message: 'Invalid reset token',
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordChangeConfirmation(
      user.email,
      user.firstName
    );

    res.status(200).json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    logger.error('Error in resetPassword:', error);
    res.status(500).json({
      message: 'Error resetting password',
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: { $exists: true },
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification token',
      });
    }

    // Verify token
    const isValidToken = await bcrypt.compare(token, user.verificationToken);
    if (!isValidToken) {
      return res.status(400).json({
        message: 'Invalid verification token',
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Send success email
    await emailService.sendVerificationSuccessEmail(
      user.email,
      user.firstName
    );

    res.status(200).json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Error in verifyEmail:', error);
    res.status(500).json({
      message: 'Error verifying email',
    });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(verificationToken, 10);

    // Update user verification token
    user.verificationToken = hash;
    user.verificationExpires = new Date(Date.now() + 86400000); // 24 hours
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.firstName
    );

    res.status(200).json({
      message: 'Verification email resent',
    });
  } catch (error) {
    logger.error('Error in resendVerification:', error);
    res.status(500).json({
      message: 'Error resending verification email',
    });
  }
};
