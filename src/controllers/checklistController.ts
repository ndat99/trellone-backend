import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import checklistService from '../services/checklistService';

export const createItem = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {content} = req.body;
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        
        if (!content) {
            res.status(400).json({
                message: 'Checklist content is required.'
            });
            return;
        }

        const newItem = await checklistService.createItem(taskId, content, userId);

        res.status(201).json({
            message: 'Checklist created successfully.',
            item: newItem
        });
    } catch (error: any){
        console.error('createItem error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
}

export const getChecklist = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const item = await checklistService.getChecklist(taskId, userId);
    
        res.status(200).json(item);
    } catch (error: any) {
        console.error('getChecklist error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const updateItem = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const checklistId = parseInt(req.params.checklistId as string, 10);
        const fields = req.body;
        const userId = req.user!.id;
        const taskId = parseInt(req.params.id as string, 10);

        const ALLOWED = ['content', 'is_done',];
        const hasValidField = Object.keys(fields).some(k => ALLOWED.includes(k));
        if (!hasValidField) {
            res.status(400).json({ message: 'At least one valid field is required: content, is_done.' });
            return;
        }

        const checklist = await checklistService.updateItem(checklistId, taskId, fields.content, fields.is_done, userId);
        res.status(200).json({
            message: 'Updated successfully',
            checklist
        });
    } catch (error: any){
        console.error('updateItem error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const deleteItem = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const checklistId = parseInt(req.params.checklistId as string, 10);
        const userId = req.user!.id;
        const taskId = parseInt(req.params.id as string, 10);

        const deletedChecklist = await checklistService.deleteItem(checklistId, taskId, userId);
        res.status(200).json({
            message: 'Deleted successfully',
            Checklist: deletedChecklist
        });
    } catch (error: any) {
        console.error('deleteItem error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const reorderItem= async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const checklistId = parseInt(req.params.checklistId as string, 10);
        const userId = req.user!.id;
        const taskId = parseInt(req.params.id as string, 10);
        const { position: newPosition } = req.body;

        await checklistService.reorderItem(checklistId, taskId, newPosition, userId);

        res.status(200).json({
            message: 'Reorder successfully.'
        });
    } catch (error: any){
        console.error('reorderItem error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};