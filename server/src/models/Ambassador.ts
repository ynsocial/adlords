import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../types';

export interface IAmbassador extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
  }[];
  certifications: {
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
  }[];
  languages: {
    language: string;
    proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Native';
  }[];
  availability: {
    status: 'Available' | 'Partially Available' | 'Not Available';
    preferredLocations: string[];
    remoteWork: boolean;
    travelPreference: 'No Travel' | 'Limited Travel' | 'Frequent Travel';
  };
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  documents: {
    type: 'Resume' | 'Certificate' | 'Other';
    title: string;
    url: string;
    uploadDate: Date;
  }[];
  status: 'Active' | 'Inactive' | 'Pending' | 'Rejected';
  verificationStatus: 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
  rating: {
    average: number;
    count: number;
  };
  completedJobs: number;
  createdAt: Date;
  updatedAt: Date;
}

const AmbassadorSchema = new Schema<IAmbassador>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    skills: [{
      type: String,
      trim: true,
    }],
    experience: [{
      title: {
        type: String,
        required: true,
      },
      company: {
        type: String,
        required: true,
      },
      location: {
        type: String,
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: Date,
      current: {
        type: Boolean,
        default: false,
      },
      description: String,
    }],
    education: [{
      institution: {
        type: String,
        required: true,
      },
      degree: {
        type: String,
        required: true,
      },
      field: {
        type: String,
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: Date,
      current: {
        type: Boolean,
        default: false,
      },
    }],
    certifications: [{
      name: {
        type: String,
        required: true,
      },
      issuer: {
        type: String,
        required: true,
      },
      issueDate: {
        type: Date,
        required: true,
      },
      expiryDate: Date,
      credentialId: String,
    }],
    languages: [{
      language: {
        type: String,
        required: true,
      },
      proficiency: {
        type: String,
        enum: ['Basic', 'Intermediate', 'Advanced', 'Native'],
        required: true,
      },
    }],
    availability: {
      status: {
        type: String,
        enum: ['Available', 'Partially Available', 'Not Available'],
        default: 'Available',
      },
      preferredLocations: [{
        type: String,
      }],
      remoteWork: {
        type: Boolean,
        default: true,
      },
      travelPreference: {
        type: String,
        enum: ['No Travel', 'Limited Travel', 'Frequent Travel'],
        default: 'Limited Travel',
      },
    },
    socialMedia: {
      linkedin: String,
      twitter: String,
      portfolio: String,
    },
    documents: [{
      type: {
        type: String,
        enum: ['Resume', 'Certificate', 'Other'],
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      uploadDate: {
        type: Date,
        default: Date.now,
      },
    }],
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending', 'Rejected'],
      default: 'Pending',
    },
    verificationStatus: {
      type: String,
      enum: ['Unverified', 'Pending', 'Verified', 'Rejected'],
      default: 'Unverified',
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for improved query performance
AmbassadorSchema.index({ userId: 1 });
AmbassadorSchema.index({ email: 1 });
AmbassadorSchema.index({ status: 1 });
AmbassadorSchema.index({ verificationStatus: 1 });
AmbassadorSchema.index({ 'rating.average': -1 });
AmbassadorSchema.index({ completedJobs: -1 });
AmbassadorSchema.index({ createdAt: -1 });

// Virtual for full name
AmbassadorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to ensure endDate is removed if current is true
AmbassadorSchema.pre('save', function(next) {
  // Handle experience dates
  this.experience.forEach(exp => {
    if (exp.current) {
      exp.endDate = undefined;
    }
  });

  // Handle education dates
  this.education.forEach(edu => {
    if (edu.current) {
      edu.endDate = undefined;
    }
  });

  next();
});

const Ambassador = mongoose.model<IAmbassador>('Ambassador', AmbassadorSchema);

export default Ambassador;
