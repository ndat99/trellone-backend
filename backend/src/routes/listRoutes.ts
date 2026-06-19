import express from 'express';
import { createList, deleteList, getList, reorderList, updateListName } from '../controllers/listController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createList);
router.get('/', protect, getList);
router.put('/:id', protect, updateListName);
router.delete('/:id', protect, deleteList);
router.patch('/:id/position', protect, reorderList);

export default router;