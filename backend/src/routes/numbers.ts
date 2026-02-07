import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { getNumbersController } from '../controllers/numbersController';

const router = express.Router();

// Numbers routes - exclude viewer and technician
router.use(authenticate);
router.use(requireRole('admin', 'manager'));

router.get('/', getNumbersController);

export default router;