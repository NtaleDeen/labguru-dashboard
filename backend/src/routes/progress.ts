import express from 'express';
import { authenticate } from '../middleware/auth';
import { getProgressController } from '../controllers/progressController';

const router = express.Router();

// Progress routes require authentication
router.use(authenticate);

router.get('/', getProgressController);

export default router;