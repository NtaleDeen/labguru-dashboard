import { Router } from 'express';
import { RevenueController } from '../controllers/RevenueController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All revenue routes require authentication
router.use(authenticate);

// Charts and KPIs require at least manager role
router.get('/', authorize('admin', 'manager'), RevenueController.getRevenueData);
router.get('/aggregations', authorize('admin', 'manager'), RevenueController.getRevenueAggregations);
router.get('/kpis', authorize('admin', 'manager'), RevenueController.getRevenueKPIs);

// Monthly targets (admin only)
router.get('/target', authorize('admin', 'manager'), RevenueController.getMonthlyTarget);
router.post('/target', authorize('admin'), RevenueController.setMonthlyTarget);

export default router;