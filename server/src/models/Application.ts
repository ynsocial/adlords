import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IJob } from './Job';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface IApplication extends Document {
  job: IJob | Schema.Types.ObjectId;
  applicant: IUser | Schema.Types.ObjectId;
  status: ApplicationStatus;
  coverLetter: string;
  resume: {
    url: string;
    filename: string;
  };
  additionalDocuments?: {
    url: string;
    filename: string;
    type: string;
  }[];
  expectedSalary?: {
    amount: number;
    currency: string;
    period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  };
  availability: {
    startDate: Date;
    noticePeriod?: number;
  };
  experience: {
    years: number;
    relevantExperience: string;
  };
  questions?: {
    question: string;
    answer: string;
  }[];
  notes?: string;
  interviews?: {
    scheduledFor: Date;
    type: 'PHONE' | 'VIDEO' | 'IN_PERSON';
    location?: string;
    notes?: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  }[];
  rating?: number;
  feedback?: string;
  withdrawalReason?: string;
  lastStatusUpdate: Date;
  statusHistory: {
    status: ApplicationStatus;
    timestamp: Date;
    updatedBy: IUser | Schema.Types.ObjectId;
    notes?: string;
  }[];
}

const applicationSchema = new Schema<IApplication>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
    },
    coverLetter: {
      type: String,
      required: true,
    },
    resume: {
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
    },
    additionalDocuments: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
      },
    ],
    expectedSalary: {
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      period: {
        type: String,
        enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
      },
    },
    availability: {
      startDate: {
        type: Date,
        required: true,
      },
      noticePeriod: {
        type: Number,
      },
    },
    experience: {
      years: {
        type: Number,
        required: true,
      },
      relevantExperience: {
        type: String,
        required: true,
      },
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
      },
    ],
    notes: String,
    interviews: [
      {
        scheduledFor: {
          type: Date,
          required: true,
        },
        type: {
          type: String,
          enum: ['PHONE', 'VIDEO', 'IN_PERSON'],
          required: true,
        },
        location: String,
        notes: String,
        status: {
          type: String,
          enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
          required: true,
        },
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    withdrawalReason: String,
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(ApplicationStatus),
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware to update lastStatusUpdate
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.lastStatusUpdate = new Date();
    this.statusHistory.push({
      status: this.status,
      timestamp: this.lastStatusUpdate,
      updatedBy: this.get('updatedBy'),
    });
  }
  next();
});

// Indexes
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ lastStatusUpdate: -1 });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
