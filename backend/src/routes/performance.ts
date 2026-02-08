import express from 'express';
import { authenticate } from '../middleware/auth';
import { getPerformanceController } from '../controllers/performanceController';

const router = express.Router();

router.use(authenticate);

router.get('/', getPerformanceController);

export default router;