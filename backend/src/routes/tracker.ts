import express from 'express';
import { authenticate } from '../middleware/auth';
import { getTrackerController } from '../controllers/trackerController';

const router = express.Router();

// Tracker routes require authentication
router.use(authenticate);

router.get('/', getTrackerController);

export default router;