import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

interface IUserDocument extends Omit<IUser, '_id'>, Document {}

// Define the User schema
const UserSchema = new Schema<IUserDocument>({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER'
  },
  spins: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

export const User = mongoose.model<IUserDocument>('User', UserSchema);