import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import commentService from '../services/commentService';

export const addComment = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {content} = req.body;
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        
        if (!content) {
            res.status(400).json({
                message: 'Comment content is required.'
            });
            return;
        }

        const newComment = await commentService.addComment(taskId, content, userId);

        res.status(201).json({
            message: 'Comment added successfully.',
            item: newComment
        });
    } catch (error: any){
        console.error('addComment error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
}

export const getComment = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const item = await commentService.getComment(taskId, userId);
    
        res.status(200).json(item);
    } catch (error: any) {
        console.error('getComment error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const editComment = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const commentId = parseInt(req.params.commentId as string, 10);
        const { content } = req.body;
        const userId = req.user!.id;
        const taskId = parseInt(req.params.id as string, 10);

        if (!content || content.trim() === "") {
            res.status(400).json({ message: 'Comment content cannot be empty.' });
            return;
        }

        const checklist = await commentService.editComment(commentId, taskId, content, userId);
        res.status(200).json({
            message: 'Edited successfully',
            checklist
        });
    } catch (error: any){
        console.error('editComment error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const deleteComment = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const commentId = parseInt(req.params.commentId as string, 10);
        const userId = req.user!.id;
        const taskId = parseInt(req.params.id as string, 10);

        const deletedComment = await commentService.deleteComment(commentId, taskId, userId);
        res.status(200).json({
            message: 'Deleted successfully',
            Comment: deletedComment
        });
    } catch (error: any) {
        console.error('deleteComment error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};