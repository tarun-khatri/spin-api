import mongoose, { Schema, Document } from 'mongoose';
import { ISpinGrant, SpinSource } from '../types';

interface ISpinGrantDocument extends ISpinGrant, Document {
  _id: mongoose.Types.ObjectId;
}

const SpinGrantSchema = new Schema<ISpinGrantDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: Object.values(SpinSource),
    required: true
  },
  date: {
    type: String,
    required: true // Format: YYYY-MM-DD
  },
  spinCount: {
    type: Number,
    required: true,
    min: 1
  },
  ipAddress: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index to prevent duplicate grants per day
SpinGrantSchema.index({ userId: 1, source: 1, date: 1 }, { unique: true });
SpinGrantSchema.index({ createdAt: 1 });

export const SpinGrant = mongoose.model<ISpinGrantDocument>('SpinGrant', SpinGrantSchema);
