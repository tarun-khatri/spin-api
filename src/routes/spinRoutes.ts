import { RequestHandler, Router } from 'express';
import { SpinController } from '../controllers/spinController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { spinGrantRateLimit } from '../middleware/rateLimiter';

const router = Router();

// POST /grant-spin - Grant free spins (Admin only, rate limited)
router.post(
  '/grant-spin',
  spinGrantRateLimit,
  authenticateToken,
  requireAdmin,
  SpinController.validateGrantSpin,
  SpinController.grantSpin as unknown as RequestHandler
);

// GET /user/:userId/spins - Get user's current spin count (Admin only)
router.get(
  '/user/:userId/spins',
  authenticateToken,
  requireAdmin,
  SpinController.getUserSpins as unknown as RequestHandler
);

// GET /user/:userId/spin-history - Get user's spin grant history (Admin only)
router.get(
  '/user/:userId/spin-history',
  authenticateToken,
  requireAdmin,
  SpinController.getSpinHistory as unknown as RequestHandler
);

export default router;