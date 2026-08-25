import express from 'express';
import { createBoard, getBoardByWorkspace, getBoardById, updateBoard, deleteBoard} from '../controllers/boardController';
import { protect } from '../middlewares/authMiddleware';
import listRoutes from './listRoutes';
import labelRoutes from './labelRoutes';
import { getBoardMembers, inviteBoardMember, removeBoardMember, updateBoardMemberRole } from '../controllers/boardMemberController';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createBoard);
router.get('/', protect, getBoardByWorkspace);
router.get('/:id', protect, getBoardById);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);
router.use('/:boardId/lists', listRoutes);
router.use('/:boardId/labels', labelRoutes);

router.post('/:id/members', protect, inviteBoardMember);
router.get('/:id/members', protect, getBoardMembers);
router.put('/:id/members/:userId', protect, updateBoardMemberRole);
router.delete('/:id/members/:userId', protect, removeBoardMember);
export default router;