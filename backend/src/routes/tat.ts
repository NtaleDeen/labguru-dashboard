import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { getTATController } from '../controllers/tatController';

const router = express.Router();

// TAT routes - exclude viewer and technician
router.use(authenticate);
router.use(requireRole('admin', 'manager'));

router.get('/', getTATController);

export default router;