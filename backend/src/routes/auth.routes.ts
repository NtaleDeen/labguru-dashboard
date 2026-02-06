import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes
router.post('/change-password', authenticate, AuthController.changePassword);
router.post('/reset-password', authenticate, AuthController.resetPassword);
router.get('/profile', authenticate, AuthController.getProfile);

export default router;