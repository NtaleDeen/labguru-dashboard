import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin', 'manager'), UserController.getAllUsers);
router.post('/', authorize('admin'), UserController.createUser);
router.get('/:id', authorize('admin', 'manager'), UserController.getUserById);
router.put('/:id', authorize('admin'), UserController.updateUser);
router.delete('/:id', authorize('admin'), UserController.deleteUser);

export default router;