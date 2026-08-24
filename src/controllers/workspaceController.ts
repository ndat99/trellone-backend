import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import workspaceService from '../services/workspaceService';

export const createWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const name = req.body.name;
        const ownerId = req.user!.id;

        if (!name){
            res.status(400).json({
                message: 'Workspace name is required.'
            });
            return;
        }

        const newWorkspace = await workspaceService.createWorkspace(name, ownerId);
        res.status(201).json({
            message: 'Workspace created successfully.',
            workspace: newWorkspace
        });
    } catch (error: any) {
        console.error('createWorkspace error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.' 
        });
    }
};


export const getWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const userId = req.user!.id; //lay id nguoi dung tu token
        const workspaces = await workspaceService.getWorkspace(userId);
        
        res.status(200).json(workspaces);
    } catch (error: any) {
        console.error('getWorkspace error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.' 
        });
    }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const workspaceId = parseInt(req.params.id as string, 10);  //lay tu id cua workspace tren URL
        const name = req.body.name; //lay ten moi tu body
        const userId = req.user!.id;

        if (!name){
            res.status(400).json({
                message: 'Workspace name is required'
            });
            return;
        }

        const workspace = await workspaceService.updateWorkspace(workspaceId, name, userId);
        
        res.status(200).json({
            message: 'Updated successfully.',
            workspace
        });
    } catch (error: any) {
        console.error('updateWorkspace error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.' 
        });
    }
};


export const deleteWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const workspaceId = parseInt(req.params.id as string, 10);
        const userId= req.user!.id;

        const workspace = await workspaceService.deleteWorkspace(workspaceId, userId);

        res.status(200).json({
            message: 'Workspace deleted successfully.',
            workspace
        });
    } catch (error: any) {
        console.error('deleteWorkspace error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.' 
        });
    }
}