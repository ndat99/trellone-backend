import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import workspaceMemberService from '../services/workspaceMemberService';

export const getWorkspaceMembers = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const workspaceId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        if (isNaN(workspaceId)){
            res.status(400).json({ message: 'Invalid workspace ID.' });
            return;
        }

        const workspaceMembers =  await workspaceMemberService.getWorkspaceMembers(workspaceId, userId);
        res.status(200).json(workspaceMembers);
    } catch (error: any){
        console.error('getWorkspaceMembers error: ', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        })
    }
};

export const inviteWorkspaceMember= async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {username} = req.body;
        const workspaceId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        
        if (!username) {
            res.status(400).json({ message: 'Username is required.' });
            return;
        }

        if (isNaN(workspaceId)){
            res.status(400).json({ message: 'Invalid workspace ID.' });
            return;
        }

        const member = await workspaceMemberService.inviteWorkspaceMember(workspaceId, username, userId);
        res.status(201).json({
            message: 'Member invited successfully.',
            member
        });
    } catch (error: any){
        console.error('inviteWorkspaceMember error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const updateWorkspaceMemberRole = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const targetUserId = parseInt(req.params.userId as string, 10);
        const workspaceId = parseInt(req.params.id as string, 10);
        const { role } = req.body;
        const userId = req.user!.id;

        if (!role) {
            res.status(400).json({ message: 'Role is required.' });
            return;
        }

        if (isNaN(targetUserId)) {
            res.status(400).json({ message: 'Target user ID is required.' });
            return;
        }

        if (isNaN(workspaceId)){
            res.status(400).json({ message: 'Invalid workspace ID.' });
            return;
        }

        const updatedMember = await workspaceMemberService.updateMemberRole(workspaceId, targetUserId, role, userId);
        res.status(200).json({
            message: 'Member role updated successfully.',
            updatedMember,
        });
    } catch (error: any){
        console.error('updateWorkspaceMemberRole error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
}

export const removeWorkspaceMember = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const targetUserId = parseInt(req.params.userId as string, 10);
        const workspaceId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        if (isNaN(targetUserId)) {
            res.status(400).json({ message: 'Target user ID is required.' });
            return;
        }

        if (isNaN(workspaceId)){
            res.status(400).json({ message: 'Invalid workspace ID.' });
            return;
        }

        await workspaceMemberService.removeWorkspaceMember(workspaceId, targetUserId, userId);
        res.status(200).json({
            message: 'Removed successfully',
        });
    } catch (error: any) {
        console.error('removeWorkspaceMember error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};