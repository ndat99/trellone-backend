import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import labelService from '../services/labelService';

export const createLabel = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {name, color} = req.body;
        const boardId = parseInt(req.params.boardId as string, 10);
        const userId = req.user!.id;
        
        if (!name) {
            res.status(400).json({
                message: 'Label name is required.'
            });
            return;
        }

        if (!color) {
            res.status(400).json({
                message: 'Label name is required.'
            });
            return;
        }

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const newLabel = await labelService.createLabel(boardId, name, userId, color);

        res.status(201).json({
            message: 'Label created successfully.',
            label: newLabel
        });
    } catch (error: any){
        console.error('createLabel error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
}

export const getLabel = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const boardId = parseInt(req.params.boardId as string, 10);
        const userId = req.user!.id;
        
        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const labels = await labelService.getLabel(boardId, userId);
    
        res.status(200).json(labels);
    } catch (error: any) {
        console.error('getLabel error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const updateLabelName = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const labelId = parseInt(req.params.id as string, 10);
        const { name } = req.body;
        const userId = req.user!.id;
        const boardId = parseInt(req.params.boardId as string, 10);

        if (!name){
            res.status(400).json({
                message: 'Label name is required.'
            });
            return;
        }

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const label = await labelService.updateLabelName(boardId, name, labelId, userId);
        res.status(200).json({
            message: 'Updated successfully',
            label
        });
    } catch (error: any){
        console.error('updateLabelName error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const deleteLabel = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const labelId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        const boardId = parseInt(req.params.boardId as string, 10);

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const deletedLabel = await labelService.deleteLabel(boardId, userId, labelId);
        res.status(200).json({
            message: 'Deleted successfully',
            label: deletedLabel
        });
    } catch (error: any) {
        console.error('deleteLabel error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};