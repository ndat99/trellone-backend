import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import listService from '../services/listService';

export const createList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {name} = req.body;
        const boardId = parseInt(req.params.boardId as string, 10);
        const userId = req.user!.id;
        
        if (!name) {
            res.status(400).json({
                message: 'List name is required.'
            });
            return;
        }

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const newList = await listService.createList(boardId, name, userId);

        res.status(201).json({
            message: 'List created successfully.',
            list: newList
        });
    } catch (error: any){
        console.error('createList error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
}

export const getList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const boardId = parseInt(req.params.boardId as string, 10);
        const userId = req.user!.id;
        
        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const lists = await listService.getList(boardId, userId);
    
        res.status(200).json(lists);
    } catch (error: any) {
        console.error('getList error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const updateListName = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const listId = parseInt(req.params.id as string, 10);
        const { name } = req.body;
        const userId = req.user!.id;
        const boardId = parseInt(req.params.boardId as string, 10);

        if (!name){
            res.status(400).json({
                message: 'List name is required.'
            });
            return;
        }

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const list = await listService.updateListName(boardId, name, listId, userId);
        res.status(200).json({
            message: 'Updated successfully',
            list
        });
    } catch (error: any){
        console.error('updateListName error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const deleteList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const listId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        const boardId = parseInt(req.params.boardId as string, 10);

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const deletedList = await listService.deleteList(boardId, userId, listId);
        res.status(200).json({
            message: 'Deleted successfully',
            list: deletedList
        });
    } catch (error: any) {
        console.error('deleteList error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const reorderList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const listId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        const boardId = parseInt(req.params.boardId as string, 10);
        const { position: newPosition } = req.body;

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        await listService.reorderList(boardId, listId, newPosition, userId);

        res.status(200).json({
            message: 'Reorder successfully.'
        });
    } catch (error: any){
        console.error('reorderList error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};