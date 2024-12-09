import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordReset extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Token expires after 1 hour
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Create index for token expiration
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);
