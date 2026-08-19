import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import taskService from '../services/taskService';

export const createTask = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {name} = req.body;
        const listId = parseInt(req.params.listId as string, 10);
        const userId = req.user!.id;
        
        if (!name) {
            res.status(400).json({
                message: 'Task name is required.'
            });
            return;
        }

        if (!listId){
            res.status(400).json({
                message: 'Choose a List'
            });
            return;
        }

        const newtask = await taskService.createTask(listId, name, userId);

        res.status(201).json({
            message: 'Task created successfully.',
            task: newtask
        });
    } catch (error: any){
        console.error('createTask error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
}

export const getTask = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const listId = parseInt(req.params.listId as string, 10);
        const userId = req.user!.id;
        
        if (!listId){
            res.status(400).json({
                message: 'Choose a List'
            });
            return;
        }

        const tasks = await taskService.getTask(listId, userId);
    
        res.status(200).json(tasks);
    } catch (error: any) {
        console.error('getTask error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const getTaskById =  async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const task =  await taskService.getTaskById(taskId, userId);
        res.status(200).json(task);
    } catch (error: any){
        console.error('getTaskById error: ', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        })
    }
};

export const updateDetails = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const fields = req.body;
        const userId = req.user!.id;

        const ALLOWED = ['name', 'description', 'is_done', 'due_date', 'start_date', 'cover_color'];
        const hasValidField = Object.keys(fields).some(k => ALLOWED.includes(k));
        if (!hasValidField) {
            res.status(400).json({ message: 'No valid fields provided.' });
            return;
        }

        const task = await taskService.updateDetails(fields, taskId, userId);
        res.status(200).json({
            message: 'Updated successfully',
            task
        });
    } catch (error: any){
        console.error('updateDetails error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const archiveTask = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const task = await taskService.toggleArchiveTask(taskId, userId);
        res.status(200).json({
            message: 'Archived/Unarchived successfully',
            task
        });
    } catch (error: any){
        console.error('archiveTask error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};


export const deleteTask = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const deletedtask = await taskService.deleteTask(userId, taskId);
        res.status(200).json({
            message: 'Deleted successfully',
            task: deletedtask
        });
    } catch (error: any) {
        console.error('deletetask error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const reorderTask = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        const { position: newPosition } = req.body;

        await taskService.reorderTask(taskId, newPosition, userId);

        res.status(200).json({
            message: 'Reorder successfully.'
        });
    } catch (error: any){
        console.error('reordertask error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.'
        });
    }
};

export const moveTask = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;
        const { list_id: targetListId, position: newPosition } = req.body;

        if (!targetListId || newPosition === undefined || newPosition === null){
            res.status(400).json({
                message: 'targetListId and position are required.'
            });
            return;
        }

        const task = await taskService.moveTask(taskId, targetListId, newPosition, userId);
        res.status(200).json({
            message: 'Task moved successfully.',
            task
        });
    } catch (error: any){
        console.error('moveTask error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error'
        });
    }
};

export const getTaskMembers = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const taskId = parseInt(req.params.id as string, 10);
        const userId = req.user!.id;

        const taskMembers =  await taskService.getTaskMembers(taskId, userId);
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

        await taskService.addTaskMember(taskId, targetUserId, userId);
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

        await taskService.removeTaskMember(taskId, targetUserId, userId);
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