import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as leadController from '../controllers/leadController';

const router = Router();

router.post('/public', leadController.submitPublic);
router.get('/', authenticate, leadController.list);
router.get('/:id', authenticate, leadController.getById);
router.post('/', authenticate, leadController.create);
router.patch('/:id', authenticate, leadController.update);
router.post('/:id/notes', authenticate, leadController.addNote);
router.delete('/:id', authenticate, authorize('admin'), leadController.remove);

export default router;
