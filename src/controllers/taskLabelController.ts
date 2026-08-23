import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import taskLabelService from '../services/taskLabelService';

export const getTaskLabels = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const taskLabels = await taskLabelService.getTaskLabels(taskId, userId);
        res.status(200).json(taskLabels);
    } catch (error: any){
        console.error('getTaskLabels error: ', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        })
    }
};

export const addTaskLabel= async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {labelId} = req.body;
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        
        if (!labelId) {
            res.status(400).json({
                message: 'Label ID is required.'
            });
            return;
        }

        if (!taskId){
            res.status(400).json({
                message: 'Choose a Task'
            });
            return;
        }

        await taskLabelService.addTaskLabel(taskId, labelId, userId);
        res.status(201).json({
            message: 'Task label added successfully.',
        });
    } catch (error: any){
        console.error('addTaskLabel error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const removeTaskLabel = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const labelId = parseInt(req.params.labelId as string, 10);
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        if (!labelId) {
            res.status(400).json({
                message: 'Label ID is required.'
            });
            return;
        }

        if (!taskId){
            res.status(400).json({
                message: 'Choose a Task'
            });
            return;
        }

        await taskLabelService.removeTaskLabel(taskId, labelId, userId);
        res.status(200).json({
            message: 'Removed successfully',
        });
    } catch (error: any) {
        console.error('removeTaskLabel error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};