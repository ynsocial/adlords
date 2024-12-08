import mongoose, { Schema, Document } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>({
  type: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  data: { type: Schema.Types.Mixed, required: true },
  result: Schema.Types.Mixed,
  error: {
    message: String,
    stack: String
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
