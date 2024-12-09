import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED',
}

export interface IJob extends Document {
  title: string;
  facility: IUser | Schema.Types.ObjectId;
  employer: IUser | Schema.Types.ObjectId;
  description: string;
  requirements: string[];
  type: JobType;
  status: JobStatus;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      type: string;
      coordinates: number[];
    };
  };
  specialty: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  };
  startDate: Date;
  endDate?: Date;
  applications: Schema.Types.ObjectId[];
  skills: string[];
  experience: {
    min: number;
    max?: number;
    unit: 'YEARS' | 'MONTHS';
  };
  benefits: string[];
  createdBy: IUser | Schema.Types.ObjectId;
  updatedBy: IUser | Schema.Types.ObjectId;
  views: number;
  applicationCount: number;
  isRemote: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
}

const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [{
      type: String,
      required: true,
    }],
    type: {
      type: String,
      enum: Object.values(JobType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: [Number],
      },
    },
    specialty: [{
      type: String,
      required: true,
    }],
    salary: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      period: {
        type: String,
        enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
        required: true,
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    applications: [{
      type: Schema.Types.ObjectId,
      ref: 'Application',
    }],
    skills: [{
      type: String,
      required: true,
    }],
    experience: {
      min: {
        type: Number,
        required: true,
      },
      max: Number,
      unit: {
        type: String,
        enum: ['YEARS', 'MONTHS'],
        required: true,
      },
    },
    benefits: [{
      type: String,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ 'location.city': 1, 'location.state': 1, 'location.country': 1 });
jobSchema.index({ specialty: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ facility: 1 });
jobSchema.index({ employer: 1 });
jobSchema.index({ 'location.coordinates': '2dsphere' });

export const Job = mongoose.model<IJob>('Job', jobSchema);
