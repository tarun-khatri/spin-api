import mongoose from 'mongoose';

export interface IUser {
    _id: mongoose.Types.ObjectId;
    userId: string;
    email: string;
    username: string;
    role: 'USER' | 'ADMIN';
    spins: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ISpinGrant {
    _id: mongoose.Types.ObjectId;
    userId: string;
    source: SpinSource;
    date: string; // YYYY-MM-DD format
    spinCount: number;
    ipAddress: string;
    createdAt: Date;
  }
  
  export interface ISpinTransaction {
    _id: mongoose.Types.ObjectId;
    userId: string;
    spinCount: number;
    source: SpinSource;
    ipAddress: string;
    timestamp: Date;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
  }
  
  export enum SpinSource {
    VAULT_REWARD = 'VAULT_REWARD',
    ADMIN_PANEL = 'ADMIN_PANEL',
    DAILY_BONUS = 'DAILY_BONUS'
  }
  
  export interface GrantSpinRequest {
    userId: string;
    source: SpinSource;
    spinCount: number;
  }
  
  export interface JWTPayload {
    userId: string;
    role: string;
    iat: number;
    exp: number;
  }
  
  export interface AuthRequest extends Request {
    user?: JWTPayload;
    body: any;
    params: any;
    query: any;
    ip?: string;
    connection?: {
      remoteAddress?: string;
    };
  }
