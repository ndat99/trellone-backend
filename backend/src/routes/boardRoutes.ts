import express from 'express';
import { createBoard, getBoardByWorkspace, getBoardById, updateBoard, deleteBoard} from '../controllers/boardController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createBoard);
router.get('/', protect, getBoardByWorkspace);
router.get('/:id', protect, getBoardById);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);

export default router;