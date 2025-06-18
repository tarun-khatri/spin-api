import { SpinSource } from '../types';
import dotenv from 'dotenv';
dotenv.config();

export const ALLOWED_SPIN_SOURCES = Object.values(SpinSource);

export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'), // 5 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'fallback-secret',
  expiresIn: process.env.JWT_EXPIRE || '24h'
};

export const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI as string,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

export const SPIN_LIMITS = {
  MAX_SPINS_PER_GRANT: 100,
  MIN_SPINS_PER_GRANT: 1
};

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';