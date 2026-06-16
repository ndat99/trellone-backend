import express from 'express';
import { createWorkspace, getWorkspace, updateWorkspace, deleteWorkspace } from '../controllers/workspaceController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspace);
router.put('/:id', protect, updateWorkspace);
router.delete('/:id', protect, deleteWorkspace);
export default router;