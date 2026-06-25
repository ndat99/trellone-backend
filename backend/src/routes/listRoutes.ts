import express from 'express';
import { createList, deleteList, getList, reorderList, updateListName } from '../controllers/listController';
import { protect } from '../middlewares/authMiddleware';
import taskRoutes from './taskRoutes';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createList);
router.get('/', protect, getList);
router.put('/:id', protect, updateListName);
router.delete('/:id', protect, deleteList);
router.patch('/:id/position', protect, reorderList);
router.use('/:listId/tasks', taskRoutes);

export default router;