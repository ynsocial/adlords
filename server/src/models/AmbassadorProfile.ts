import mongoose, { Document, Schema } from 'mongoose';

export interface IAmbassadorProfile extends Document {
  userId: Schema.Types.ObjectId;
  category: string;
  bio: string;
  specialties: string[];
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  referralCode: string;
  totalReferrals: number;
  earnings: number;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
}

const ambassadorProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['athlete', 'fitness', 'health', 'beauty', 'elderly', 'youth']
  },
  bio: {
    type: String,
    required: true,
    maxlength: 500
  },
  specialties: [{
    type: String,
    required: true
  }],
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
    linkedin: String
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Generate unique referral code before saving
ambassadorProfileSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.referralCode = 'TH' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

export const AmbassadorProfile = mongoose.model<IAmbassadorProfile>('AmbassadorProfile', ambassadorProfileSchema);
