import mongoose, { Schema, Document } from 'mongoose';
import { IAuditLog } from '../types';

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  action: { type: String, required: true },
  entityType: {
    type: String,
    enum: ['job', 'application', 'company', 'ambassador', 'user'],
    required: true
  },
  entityId: { type: Schema.Types.ObjectId, required: true },
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }],
  metadata: Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
