import express from 'express';
import { createWorkspace, getWorkspace, updateWorkspace, deleteWorkspace } from '../controllers/workspaceController';
import { protect } from '../middlewares/authMiddleware';
import boardRoutes from './boardRoutes';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspace);
router.put('/:id', protect, updateWorkspace);
router.delete('/:id', protect, deleteWorkspace);
router.use('/:workspaceId/boards', boardRoutes);

export default router;