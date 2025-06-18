import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/constants';
import { VaultLogger } from '../utils/VaultLogger';

export const spinGrantRateLimit = rateLimit({
  ...RATE_LIMIT_CONFIG,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  handler: (req, res) => {
    VaultLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: RATE_LIMIT_CONFIG.message.error,
      code: RATE_LIMIT_CONFIG.message.code,
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000)
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks or specific conditions
    return req.path === '/health';
  }
});