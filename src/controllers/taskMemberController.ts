import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import taskMemberService from '../services/taskMemberService';

export const getTaskMembers = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const taskMembers =  await taskMemberService.getTaskMembers(taskId, userId);
        res.status(200).json(taskMembers);
    } catch (error: any){
        console.error('getTaskMembers error: ', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        })
    }
};

export const addTaskMember= async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {targetUserId} = req.body;
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        
        if (!targetUserId) {
            res.status(400).json({
                message: 'Target user ID is required.'
            });
            return;
        }

        if (!taskId){
            res.status(400).json({
                message: 'Choose a Task'
            });
            return;
        }

        await taskMemberService.addTaskMember(taskId, targetUserId, userId);
        res.status(201).json({
            message: 'Task member added successfully.',
        });
    } catch (error: any){
        console.error('addTaskMember error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const removeTaskMember = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const targetUserId = parseInt(req.params.userId as string, 10);
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        if (!targetUserId) {
            res.status(400).json({
                message: 'Target user ID is required.'
            });
            return;
        }

        if (!taskId){
            res.status(400).json({
                message: 'Choose a Task'
            });
            return;
        }

        await taskMemberService.removeTaskMember(taskId, targetUserId, userId);
        res.status(200).json({
            message: 'Removed successfully',
        });
    } catch (error: any) {
        console.error('removeTaskMember error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};