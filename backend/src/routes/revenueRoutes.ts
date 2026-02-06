import { Router } from 'express';
import {
  getDailyRevenue,
  getSectionRevenue,
  getTopTests,
  getDashboardStats,
  getMonthlyRevenue,
  getQuarterlyRevenue,
} from '../controllers/revenueController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All revenue routes require authentication
router.use(authenticateToken);

router.get('/daily', getDailyRevenue);
router.get('/section', getSectionRevenue);
router.get('/top-tests', getTopTests);
router.get('/dashboard-stats', getDashboardStats);
router.get('/monthly', getMonthlyRevenue);
router.get('/quarterly', getQuarterlyRevenue);

export default router;