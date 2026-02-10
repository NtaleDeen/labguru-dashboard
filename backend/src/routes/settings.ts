import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import {
  // Revenue targets
  getMonthlyTargetController,
  setMonthlyTargetController,
  
  // Tests targets
  getTestsTargetController,
  setTestsTargetController,
  getAllTestsTargetsController,
  
  // Numbers targets
  getNumbersTargetController,
  setNumbersTargetController,
  getAllNumbersTargetsController,
  
  // General settings
  getAllSettingsController,
} from '../controllers/settingsController';

const router = express.Router();

router.use(authenticate);

// ============================================================================
// REVENUE TARGET ROUTES
// ============================================================================
router.get('/monthly-target', getMonthlyTargetController);
router.post('/monthly-target', requireRole('admin', 'manager'), setMonthlyTargetController);

// ============================================================================
// TESTS TARGET ROUTES
// ============================================================================
router.get('/tests-target', getTestsTargetController);
router.post('/tests-target', requireRole('admin', 'manager'), setTestsTargetController);
router.get('/tests-targets/all', requireRole('admin', 'manager'), getAllTestsTargetsController);

// ============================================================================
// NUMBERS TARGET ROUTES
// ============================================================================
router.get('/numbers-target', getNumbersTargetController);
router.post('/numbers-target', requireRole('admin', 'manager'), setNumbersTargetController);
router.get('/numbers-targets/all', requireRole('admin', 'manager'), getAllNumbersTargetsController);

// ============================================================================
// GENERAL SETTINGS ROUTES
// ============================================================================
router.get('/', requireRole('admin', 'manager'), getAllSettingsController);

export default router;