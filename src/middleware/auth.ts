import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/constants';
import { JWTPayload, AuthRequest } from '../types';
import { VaultLogger } from '../utils/VaultLogger';

interface CustomRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    VaultLogger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(401).json({
      success: false,
      error: 'Access token is required',
      code: 'TOKEN_REQUIRED'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as JWTPayload;
    req.user = decoded;
    
    VaultLogger.info('User authenticated successfully', {
      userId: decoded.userId,
      role: decoded.role,
      ip: req.ip
    });
    
    next();
  } catch (error) {
    VaultLogger.warn('Authentication failed: Invalid token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const requireAdmin = (req: CustomRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    VaultLogger.warn('Authorization failed: Insufficient privileges', {
      userId: req.user.userId,
      role: req.user.role,
      ip: req.ip
    });
    
    res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
    return;
  }

  next();
};