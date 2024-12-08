import { Request, Response } from 'express';
import { User } from '../models/User';
import { AmbassadorProfile } from '../models/AmbassadorProfile';
import { generateToken } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, category, bio, specialties } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || 'ambassador'
    });

    await user.save();

    // If registering as ambassador, create profile
    if (role === 'ambassador') {
      const ambassadorProfile = new AmbassadorProfile({
        userId: user._id,
        category,
        bio,
        specialties
      });

      await ambassadorProfile.save();
    }

    const token = generateToken(user);

    res.status(201).json({
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
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

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
    res.status(500).json({ error: 'Error logging in' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    if (user.role === 'ambassador') {
      profile = await AmbassadorProfile.findOne({ userId: user._id });
    }

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
};
