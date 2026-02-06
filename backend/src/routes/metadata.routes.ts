import { Router } from 'express';
import multer from 'multer';
import { MetadataController } from '../controllers/MetadataController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All metadata routes require authentication
router.use(authenticate);

// Public read access for authenticated users
router.get('/', MetadataController.getAllMetadata);
router.get('/unmatched', authorize('admin', 'manager'), MetadataController.getUnmatchedTests);
router.get('/export', authorize('admin', 'manager'), MetadataController.exportToCsv);

// Admin/Manager write access
router.post('/', authorize('admin', 'manager'), MetadataController.createMetadata);
router.post('/import', authorize('admin', 'manager'), upload.single('file'), MetadataController.importFromCsv);
router.put('/:id', authorize('admin', 'manager'), MetadataController.updateMetadata);
router.delete('/:id', authorize('admin'), MetadataController.deleteMetadata);

export default router;