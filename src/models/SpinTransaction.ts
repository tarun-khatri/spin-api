import mongoose, { Schema, Document } from 'mongoose';
import { ISpinTransaction, SpinSource } from '../types';

interface ISpinTransactionDocument extends ISpinTransaction, Document {
  _id: mongoose.Types.ObjectId;
}

const SpinTransactionSchema = new Schema<ISpinTransactionDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  spinCount: {
    type: Number,
    required: true,
    min: 1
  },
  source: {
    type: String,
    enum: Object.values(SpinSource),
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    required: true
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  versionKey: false
});

SpinTransactionSchema.index({ userId: 1, timestamp: -1 });
SpinTransactionSchema.index({ status: 1 });

export const SpinTransaction = mongoose.model<ISpinTransactionDocument>('SpinTransaction', SpinTransactionSchema);
