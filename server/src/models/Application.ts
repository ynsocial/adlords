import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  ambassadorId: mongoose.Types.ObjectId;
  status: 'Pending' | 'Shortlisted' | 'Interviewing' | 'Approved' | 'Rejected' | 'Withdrawn';
  submissionDate: Date;
  coverLetter: string;
  attachments: {
    type: string;
    url: string;
    name: string;
    size: number;
    uploadedAt: Date;
  }[];
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  notes: {
    content: string;
    author: mongoose.Types.ObjectId;
    createdAt: Date;
    isPrivate: boolean;
  }[];
  timeline: {
    status: string;
    date: Date;
    updatedBy: mongoose.Types.ObjectId;
    note?: string;
  }[];
  metadata: {
    lastStatusUpdate: Date;
    lastInteractionDate: Date;
    isUrgent: boolean;
    tags: string[];
  };
  feedback?: {
    rating: number;
    comment: string;
    givenBy: mongoose.Types.ObjectId;
    givenAt: Date;
  };
  interviewSchedule?: {
    date: Date;
    type: 'Phone' | 'Video' | 'In-Person';
    location?: string;
    meetingLink?: string;
    notes?: string;
    interviewers: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    ambassadorId: {
      type: Schema.Types.ObjectId,
      ref: 'Ambassador',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Shortlisted', 'Interviewing', 'Approved', 'Rejected', 'Withdrawn'],
      default: 'Pending',
      index: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    coverLetter: {
      type: String,
      required: true,
      minlength: 100,
      maxlength: 2000,
    },
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
    referralCode: {
      type: String,
      sparse: true,
      index: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'Ambassador',
      sparse: true,
      index: true,
    },
    notes: [{
      content: {
        type: String,
        required: true,
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      isPrivate: {
        type: Boolean,
        default: false,
      },
    }],
    timeline: [{
      status: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      note: String,
    }],
    metadata: {
      lastStatusUpdate: {
        type: Date,
        default: Date.now,
      },
      lastInteractionDate: {
        type: Date,
        default: Date.now,
      },
      isUrgent: {
        type: Boolean,
        default: false,
      },
      tags: [{
        type: String,
        trim: true,
      }],
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      givenBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      givenAt: Date,
    },
    interviewSchedule: {
      date: Date,
      type: {
        type: String,
        enum: ['Phone', 'Video', 'In-Person'],
      },
      location: String,
      meetingLink: String,
      notes: String,
      interviewers: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ApplicationSchema.index({ jobId: 1, ambassadorId: 1 }, { unique: true });
ApplicationSchema.index({ status: 1, submissionDate: -1 });
ApplicationSchema.index({ 'metadata.lastStatusUpdate': -1 });
ApplicationSchema.index({ 'metadata.lastInteractionDate': -1 });
ApplicationSchema.index({ 'metadata.tags': 1 });

// Middleware to update metadata on status change
ApplicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.metadata.lastStatusUpdate = new Date();
    this.timeline.push({
      status: this.status,
      date: new Date(),
      updatedBy: this.modifiedBy, // Assuming modifiedBy is set in the service
      note: this.statusNote, // Assuming statusNote is set in the service
    });
  }
  this.metadata.lastInteractionDate = new Date();
  next();
});

// Virtual for time since last update
ApplicationSchema.virtual('timeSinceLastUpdate').get(function() {
  return new Date().getTime() - this.metadata.lastStatusUpdate.getTime();
});

// Virtual for application age
ApplicationSchema.virtual('applicationAge').get(function() {
  return new Date().getTime() - this.submissionDate.getTime();
});

// Virtual for interview status
ApplicationSchema.virtual('interviewStatus').get(function() {
  if (!this.interviewSchedule) return 'No Interview';
  const now = new Date();
  if (this.interviewSchedule.date < now) return 'Completed';
  return 'Scheduled';
});

// Method to check if application can be withdrawn
ApplicationSchema.methods.canBeWithdrawn = function(): boolean {
  return ['Pending', 'Shortlisted', 'Interviewing'].includes(this.status);
};

// Method to check if feedback can be added
ApplicationSchema.methods.canAddFeedback = function(): boolean {
  return this.status === 'Approved' && !this.feedback;
};

const Application = mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;
