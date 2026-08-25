import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import boardMemberService from '../services/boardMemberService';

export const getBoardMembers = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const boardId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        if (isNaN(boardId)){
            res.status(400).json({ message: 'Invalid board ID.' });
            return;
        }

        const boardMembers =  await boardMemberService.getBoardMembers(boardId, userId);
        res.status(200).json(boardMembers);
    } catch (error: any){
        console.error('getBoardMembers error: ', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        })
    }
};

export const inviteBoardMember= async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {username} = req.body;
        const boardId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        
        if (!username) {
            res.status(400).json({ message: 'Username is required.' });
            return;
        }

        if (isNaN(boardId)){
            res.status(400).json({ message: 'Invalid board ID.' });
            return;
        }

        const member = await boardMemberService.inviteBoardMember(boardId, username, userId);
        res.status(201).json({
            message: 'Member invited successfully.',
            member
        });
    } catch (error: any){
        console.error('inviteBoardMember error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const updateBoardMemberRole = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const targetUserId = parseInt(req.params.userId as string, 10);
        const boardId = parseInt(req.params.id as string, 10);
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

        if (isNaN(boardId)){
            res.status(400).json({ message: 'Invalid board ID.' });
            return;
        }

        const updatedMember = await boardMemberService.updateMemberRole(boardId, targetUserId, role, userId);
        res.status(200).json({
            message: 'Member role updated successfully.',
            updatedMember,
        });
    } catch (error: any){
        console.error('updateBoardMemberRole error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
}

export const removeBoardMember = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const targetUserId = parseInt(req.params.userId as string, 10);
        const boardId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        if (isNaN(targetUserId)) {
            res.status(400).json({ message: 'Target user ID is required.' });
            return;
        }

        if (isNaN(boardId)){
            res.status(400).json({ message: 'Invalid board ID.' });
            return;
        }

        await boardMemberService.removeBoardMember(boardId, targetUserId, userId);
        res.status(200).json({
            message: 'Removed successfully',
        });
    } catch (error: any) {
        console.error('removeBoardMember error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};