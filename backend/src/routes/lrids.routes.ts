import { Router } from 'express';
import { LRIDSController } from '../controllers/LRIDSController';
import { authenticate } from '../middleware/auth';

const router = Router();

// LRIDS is viewable by all authenticated users
router.use(authenticate);

router.get('/', LRIDSController.getLRIDSData);
router.post('/cancel', LRIDSController.cancelTest);
router.get('/cancelled', LRIDSController.getCancelledTests);

export default router;