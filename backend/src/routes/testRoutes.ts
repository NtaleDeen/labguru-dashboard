import { Router } from 'express';
import {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getLabSections,
  bulkImportTests,
} from '../controllers/testController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Read routes - all authenticated users
router.get('/', getAllTests);
router.get('/sections', getLabSections);
router.get('/:id', getTestById);

// Write routes - manager and technician only
router.post('/', authorizeRoles('manager', 'technician'), createTest);
router.put('/:id', authorizeRoles('manager', 'technician'), updateTest);
router.delete('/:id', authorizeRoles('manager'), deleteTest);
router.post('/bulk-import', authorizeRoles('manager'), bulkImportTests);

export default router;