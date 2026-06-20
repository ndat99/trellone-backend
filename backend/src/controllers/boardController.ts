import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import boardService from '../services/boardService';

export const createBoard = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {name} = req.body;
        const workspaceId = parseInt(req.params.workspaceId as string, 10) || parseInt(req.body.workspace_id, 10);
        const userId = req.user!.id;

        if (!name){
            res.status(400).json({
                message: 'Board name is required.'
            });
            return;
        }

        if (!workspaceId){
            res.status(400).json({
                message: 'Choose a Workspace'
            });
            return;
        }

        const newBoard = await boardService.createBoard(userId, name, workspaceId);

        res.status(201).json({
            message: 'Board created successfully.',
            board : newBoard
        });
    } catch (error: any){
        console.error('createBoard error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const getBoardByWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const workspaceId = parseInt(req.params.workspaceId as string, 10) || parseInt(req.body.workspace_id, 10);
        const userId = req.user!.id;
        
        const boards = await boardService.getBoardByWorkspace(userId, workspaceId);
        res.status(200).json(boards);
    } catch (error: any) {
        console.error('getBoardByWorkspace error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error'
        });
    }
};

export const getBoardById = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const userId = req.user!.id;
        const boardId = parseInt(req.params.id as string, 10);

        const board = await boardService.getBoardById(userId, boardId);
        res.status(200).json(board);
    }  catch (error: any) {
        console.error('getBoardById error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error'
        });
    }
};

export const updateBoard = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const boardId = parseInt(req.params.id as string, 10);
        const { name, bg_color: bgColor, bg_image_url: bgImgUrl } = req.body;
        const userId = req.user!.id;

        if (!name) {
            res.status(400).json({
                message: 'Board name is required'
            });
            return;
        }
        
        const board = await boardService.updateBoard(name, bgColor, bgImgUrl, userId, boardId);

        res.status(200).json({
            message: 'Updated successfully',
            board
        });
    } catch (error: any){
        console.error('updateBoard error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error'
        });
    }
};

export const deleteBoard = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const boardId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        
        const deletedBoard = await boardService.deleteBoard(boardId, userId);

        res.status(200).json({
            message: 'Board deleted successfully.',
            deletedBoard
        });
    } catch (error: any){
        console.error('deleteBoard error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error'
        });
    }
};