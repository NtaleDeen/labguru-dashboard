import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import {
  getMonthlyTargetController,
  setMonthlyTargetController,
  getAllSettingsController,
} from '../controllers/settingsController';

const router = express.Router();

router.use(authenticate);

router.get('/monthly-target', getMonthlyTargetController);
router.post('/monthly-target', requireRole('admin', 'manager'), setMonthlyTargetController);
router.get('/', requireRole('admin', 'manager'), getAllSettingsController);

export default router;