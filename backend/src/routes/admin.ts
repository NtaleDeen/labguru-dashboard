import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import {
  getUnmatchedTestsController,
  resolveUnmatchedTestController,
  getDashboardStatsController,
} from '../controllers/adminController';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin', 'manager'));

router.get('/unmatched-tests', getUnmatchedTestsController);
router.post('/unmatched-tests/:id/resolve', resolveUnmatchedTestController);
router.get('/stats', getDashboardStatsController);

export default router;