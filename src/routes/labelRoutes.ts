import express from 'express';
import { createLabel, deleteLabel, getLabel, updateLabelName } from '../controllers/labelController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createLabel);
router.get('/', protect, getLabel);
router.put('/:id', protect, updateLabelName);
router.delete('/:id', protect, deleteLabel);

export default router;