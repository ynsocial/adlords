import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: {
    required: string[];
    preferred: string[];
  };
  category: string[];
  type: 'Full-time' | 'Part-time' | 'Contract' | 'One-time';
  location: {
    type: 'Remote' | 'On-site' | 'Hybrid';
    cities?: string[];
    countries?: string[];
  };
  budget: {
    range: {
      min: number;
      max: number;
    };
    currency: string;
    type: 'Fixed' | 'Hourly' | 'Daily';
    negotiable: boolean;
  };
  duration: {
    startDate: Date;
    endDate?: Date;
    estimatedHours?: number;
    estimatedDays?: number;
  };
  skills: string[];
  attachments: {
    type: string;
    url: string;
    name: string;
    size: number;
    uploadedAt: Date;
  }[];
  status: 'Draft' | 'Pending' | 'Active' | 'Paused' | 'Completed' | 'Cancelled' | 'Rejected';
  visibility: 'Public' | 'Private' | 'Featured';
  applicationDeadline?: Date;
  maxApplications?: number;
  currentApplications: number;
  views: number;
  metadata: {
    isUrgent?: boolean;
    isHighlighted?: boolean;
    isFeatured?: boolean;
    tags?: string[];
  };
  statistics: {
    totalViews: number;
    uniqueViews: number;
    applications: number;
    saves: number;
    shares: number;
  };
  moderationStatus: {
    status: 'Pending' | 'Approved' | 'Rejected';
    moderatedBy?: mongoose.Types.ObjectId;
    moderatedAt?: Date;
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      minlength: 100,
      maxlength: 5000,
    },
    shortDescription: {
      type: String,
      required: true,
      minlength: 50,
      maxlength: 250,
    },
    requirements: [{
      type: String,
      required: true,
      trim: true,
    }],
    responsibilities: [{
      type: String,
      required: true,
      trim: true,
    }],
    qualifications: {
      required: [{
        type: String,
        trim: true,
      }],
      preferred: [{
        type: String,
        trim: true,
      }],
    },
    category: [{
      type: String,
      required: true,
    }],
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'One-time'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Remote', 'On-site', 'Hybrid'],
        required: true,
      },
      cities: [{
        type: String,
        trim: true,
      }],
      countries: [{
        type: String,
        trim: true,
      }],
    },
    budget: {
      range: {
        min: {
          type: Number,
          required: true,
          min: 0,
        },
        max: {
          type: Number,
          required: true,
          min: 0,
        },
      },
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
      type: {
        type: String,
        enum: ['Fixed', 'Hourly', 'Daily'],
        required: true,
      },
      negotiable: {
        type: Boolean,
        default: false,
      },
    },
    duration: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: Date,
      estimatedHours: Number,
      estimatedDays: Number,
    },
    skills: [{
      type: String,
      required: true,
      trim: true,
    }],
    attachments: [{
      type: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Active', 'Paused', 'Completed', 'Cancelled', 'Rejected'],
      default: 'Draft',
    },
    visibility: {
      type: String,
      enum: ['Public', 'Private', 'Featured'],
      default: 'Public',
    },
    applicationDeadline: Date,
    maxApplications: Number,
    currentApplications: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    metadata: {
      isUrgent: {
        type: Boolean,
        default: false,
      },
      isHighlighted: {
        type: Boolean,
        default: false,
      },
      isFeatured: {
        type: Boolean,
        default: false,
      },
      tags: [{
        type: String,
        trim: true,
      }],
    },
    statistics: {
      totalViews: {
        type: Number,
        default: 0,
      },
      uniqueViews: {
        type: Number,
        default: 0,
      },
      applications: {
        type: Number,
        default: 0,
      },
      saves: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
    },
    moderationStatus: {
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
      },
      moderatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      moderatedAt: Date,
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for improved query performance
JobSchema.index({ companyId: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ 'moderationStatus.status': 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ skills: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ 'budget.range.min': 1, 'budget.range.max': 1 });
JobSchema.index({ 'location.type': 1 });
JobSchema.index({ 'location.cities': 1 });
JobSchema.index({ 'location.countries': 1 });
JobSchema.index({ 
  title: 'text', 
  shortDescription: 'text', 
  description: 'text',
  skills: 'text',
});

// Middleware to ensure budget range is valid
JobSchema.pre('save', function(next) {
  if (this.budget.range.min > this.budget.range.max) {
    next(new Error('Minimum budget cannot be greater than maximum budget'));
  }
  next();
});

// Virtual for application status
JobSchema.virtual('isAcceptingApplications').get(function() {
  if (this.status !== 'Active') return false;
  if (this.applicationDeadline && new Date() > this.applicationDeadline) return false;
  if (this.maxApplications && this.currentApplications >= this.maxApplications) return false;
  return true;
});

// Virtual for remaining spots
JobSchema.virtual('remainingSpots').get(function() {
  if (!this.maxApplications) return null;
  return Math.max(0, this.maxApplications - this.currentApplications);
});

// Virtual for time until deadline
JobSchema.virtual('timeUntilDeadline').get(function() {
  if (!this.applicationDeadline) return null;
  return this.applicationDeadline.getTime() - new Date().getTime();
});

const Job = mongoose.model<IJob>('Job', JobSchema);

export default Job;
