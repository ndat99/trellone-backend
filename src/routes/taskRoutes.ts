import express from 'express';
import { addTaskLabel, addTaskMember, archiveTask, createTask, deleteTask, getTask, getTaskById, getTaskLabels, getTaskMembers, moveTask, removeTaskLabel, removeTaskMember, reorderTask, updateDetails } from '../controllers/taskController';
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

router.get('/:id/members/', protect, getTaskMembers);
router.post('/:id/members/', protect, addTaskMember);
router.delete('/:id/members/:userId', protect, removeTaskMember);

router.get('/:id/labels/', protect, getTaskLabels);
router.post('/:id/labels/', protect, addTaskLabel);
router.delete('/:id/labels/:labelId', protect, removeTaskLabel);
export default router;