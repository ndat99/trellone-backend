import express from 'express';
import { archiveTask, createTask, deleteTask, getTask, getTaskById, moveTask, reorderTask, updateDetails } from '../controllers/taskController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createTask);
router.get('/', protect, getTask);
router.get('/:id', protect, getTaskById);
router.delete('/:id', protect, deleteTask);
router.patch('/:id/archive', protect, archiveTask);
router.patch('/:id/details', protect, updateDetails);
router.patch('/:id/position', protect, reorderTask);
router.patch('/:id/move', protect, moveTask);

export default router;