import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { SpinGrant } from '../models/SpinGrant';
import { SpinTransaction } from '../models/SpinTransaction';
import { GrantSpinRequest, SpinSource, AuthRequest } from '../types';
import { ALLOWED_SPIN_SOURCES, SPIN_LIMITS } from '../config/constants';
import { VaultLogger } from '../utils/VaultLogger';

export class SpinController {
  
  // Validation middleware
  public static validateGrantSpin = [
    body('userId')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('User ID is required and must be between 1-50 characters'),
    
    body('source')
      .isIn(ALLOWED_SPIN_SOURCES)
      .withMessage(`Source must be one of: ${ALLOWED_SPIN_SOURCES.join(', ')}`),
    
    body('spinCount')
      .isInt({ min: SPIN_LIMITS.MIN_SPINS_PER_GRANT, max: SPIN_LIMITS.MAX_SPINS_PER_GRANT })
      .withMessage(`Spin count must be between ${SPIN_LIMITS.MIN_SPINS_PER_GRANT} and ${SPIN_LIMITS.MAX_SPINS_PER_GRANT}`)
  ];

  public static async grantSpin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
        return;
      }

      const { userId, source, spinCount }: GrantSpinRequest = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      VaultLogger.info('Spin grant request received', {
        userId,
        source,
        spinCount,
        ipAddress,
        requestedBy: req.user?.userId
      });

      // Check if user exists, create if not
      let user = await User.findOne({ userId });
      if (!user) {
        user = new User({
          userId,
          email: `${userId}@example.com`, // Default email
          username: `user_${userId}`,
          role: 'USER',
          spins: 0
        });
        await user.save();
        VaultLogger.info('New user created', { userId });
      }

      // Check for duplicate spin grant (same user, source, and date)
      const existingGrant = await SpinGrant.findOne({
        userId,
        source,
        date: currentDate
      });

      if (existingGrant) {
        const errorMessage = 'Duplicate spin grant detected for today';
        
        // Log failed transaction
        await SpinController.logTransaction({
          userId,
          spinCount,
          source: source as SpinSource,
          ipAddress,
          status: 'FAILED',
          errorMessage
        });

        res.status(409).json({
          success: false,
          error: errorMessage,
          code: 'DUPLICATE_GRANT',
          details: {
            existingGrant: {
              date: existingGrant.date,
              spinCount: existingGrant.spinCount,
              grantedAt: existingGrant.createdAt
            }
          }
        });
        return;
      }

      // Create spin grant record
      const spinGrant = new SpinGrant({
        userId,
        source,
        date: currentDate,
        spinCount,
        ipAddress
      });

      // Update user's spin count
      user.spins += spinCount;

      // Save both records in a transaction-like manner
      await Promise.all([
        spinGrant.save(),
        user.save()
      ]);

      // Log successful transaction
      await SpinController.logTransaction({
        userId,
        spinCount,
        source: source as SpinSource,
        ipAddress,
        status: 'SUCCESS'
      });

      VaultLogger.info('Spin grant successful', {
        userId,
        source,
        spinCount,
        newTotalSpins: user.spins,
        grantId: spinGrant._id
      });

      res.status(200).json({
        success: true,
        message: 'Spins granted successfully',
        data: {
          userId,
          spinCount,
          source,
          totalSpins: user.spins,
          grantId: spinGrant._id,
          grantedAt: spinGrant.createdAt
        }
      });

    } catch (error) {
      VaultLogger.error('Error granting spins', error);
      
      // Log failed transaction
      try {
        const { userId, source, spinCount } = req.body;
        await SpinController.logTransaction({
          userId,
          spinCount,
          source: source as SpinSource,
          ipAddress: req.ip || 'unknown',
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        VaultLogger.error('Failed to log failed transaction', logError);
      }

      next(error);
    }
  }

  public static async getUserSpins(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'USER_ID_REQUIRED'
        });
        return;
      }

      const user = await User.findOne({ userId });
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          userId: user.userId,
          spins: user.spins,
          lastUpdated: user.updatedAt
        }
      });

    } catch (error) {
      VaultLogger.error('Error getting user spins', error);
      next(error);
    }
  }

  public static async getSpinHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'USER_ID_REQUIRED'
        });
        return;
      }

      const [grants, total] = await Promise.all([
        SpinGrant.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SpinGrant.countDocuments({ userId })
      ]);

      res.status(200).json({
        success: true,
        data: {
          grants,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      VaultLogger.error('Error getting spin history', error);
      next(error);
    }
  }

  private static async logTransaction(data: {
    userId: string;
    spinCount: number;
    source: SpinSource;
    ipAddress: string;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
  }): Promise<void> {
    try {
      const transaction = new SpinTransaction({
        ...data,
        timestamp: new Date()
      });
      
      await transaction.save();
      VaultLogger.logSpinTransaction({
        ...data,
        timestamp: new Date()
      });
    } catch (error) {
      VaultLogger.error('Failed to log spin transaction', error);
    }
  }
}