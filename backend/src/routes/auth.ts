import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import {
  loginController,
  getUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  resetPasswordController,
} from '../controllers/authController';

const router = express.Router();

// Public route
router.post('/login', loginController);

// Protected routes - require authentication
router.get('/users', authenticate, requireRole('admin', 'manager'), getUsersController);
router.post('/users', authenticate, requireRole('admin'), createUserController);
router.put('/users/:id', authenticate, requireRole('admin', 'manager'), updateUserController);
router.delete('/users/:id', authenticate, requireRole('admin'), deleteUserController);
router.post('/users/:id/reset-password', authenticate, requireRole('admin'), resetPasswordController);

export default router;