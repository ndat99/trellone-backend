import express from 'express';
import { archiveTask, createTask, deleteTask, getTask, getTaskById, moveTask, reorderTask, updateDetails } from '../controllers/taskController';
import { addTaskMember, getTaskMembers, removeTaskMember } from '../controllers/taskMemberController';
import { addTaskLabel, getTaskLabels, removeTaskLabel} from '../controllers/taskLabelController';
import { protect } from '../middlewares/authMiddleware';
import { createItem, deleteItem, getChecklist, updateItem, reorderItem } from '../controllers/checklistController';

const router = express.Router({ mergeParams: true });

//task
router.post('/', protect, createTask);
router.get('/', protect, getTask);
router.get('/:id', protect, getTaskById);
router.delete('/:id', protect, deleteTask);
router.patch('/:id/archive', protect, archiveTask);
router.patch('/:id/details', protect, updateDetails);
router.patch('/:id/position', protect, reorderTask);
router.patch('/:id/move', protect, moveTask);

//task member
router.get('/:id/members/', protect, getTaskMembers);
router.post('/:id/members/', protect, addTaskMember);
router.delete('/:id/members/:userId', protect, removeTaskMember);

//task label
router.get('/:id/labels/', protect, getTaskLabels);
router.post('/:id/labels/', protect, addTaskLabel);
router.delete('/:id/labels/:labelId', protect, removeTaskLabel);

//checklist item
router.post('/:id/checklists', protect, createItem);
router.get('/:id/checklists', protect, getChecklist);
router.patch('/:id/checklists/:checklistId', protect, updateItem);
router.delete('/:id/checklists/:checklistId', protect, deleteItem);
router.patch('/:id/checklists/:checklistId/position', protect, reorderItem);

export default router;