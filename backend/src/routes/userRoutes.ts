import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All user routes require authentication and manager role
router.use(authenticateToken);
router.use(authorizeRoles('manager'));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;