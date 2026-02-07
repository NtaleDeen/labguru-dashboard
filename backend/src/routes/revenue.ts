import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import {
  getRevenueController,
  getLabSectionsController,
} from '../controllers/revenueController';

const router = express.Router();

// Revenue routes - exclude viewer and technician
router.use(authenticate);
router.use(requireRole('admin', 'manager'));

router.get('/', getRevenueController);
router.get('/lab-sections', getLabSectionsController);

export default router;