import express from 'express';
import { createWorkspace, getWorkspace, updateWorkspace, deleteWorkspace } from '../controllers/workspaceController';
import { protect } from '../middlewares/authMiddleware';
import boardRoutes from './boardRoutes';
import { getWorkspaceMembers, inviteWorkspaceMember, removeWorkspaceMember, updateWorkspaceMemberRole } from '../controllers/workspaceMemberController';

const router = express.Router({ mergeParams: true });

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspace);
router.put('/:id', protect, updateWorkspace);
router.delete('/:id', protect, deleteWorkspace);
router.use('/:workspaceId/boards', boardRoutes);

router.post('/:id/members', protect, inviteWorkspaceMember);
router.get('/:id/members', protect, getWorkspaceMembers);
router.put('/:id/members/:userId', protect, updateWorkspaceMemberRole);
router.delete('/:id/members/:userId', protect, removeWorkspaceMember);
export default router;