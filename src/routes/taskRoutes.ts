import express from 'express';
import { createTask, deleteTask, getTask, moveTask, reorderTask, updateTaskName } from '../controllers/taskController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createTask);
router.get('/', protect, getTask);
router.put('/:id', protect, updateTaskName);
router.delete('/:id', protect, deleteTask);
router.patch('/:id/position', protect, reorderTask);
router.patch('/:id/move', protect, moveTask);

export default router;