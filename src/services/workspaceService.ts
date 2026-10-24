import pool from '../config/db';
import workspaceMemberModel from '../models/workspaceMemberModel';
import workspaceModel, { WorkspaceRow } from '../models/workspaceModel';

const workspaceService = {
    getWorkspace: async (userId: number): Promise<WorkspaceRow[]> => {
        return workspaceModel.findByUserId(userId);
    },

    createWorkspace: async (name: string, ownerId: number) : Promise<WorkspaceRow> => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const newWorkspace = await workspaceModel.create(name, ownerId, client);
            await workspaceMemberModel.addOwner(newWorkspace.id, ownerId, client);

            await client.query('COMMIT');
            return newWorkspace;
        } catch (error){
            await client.query('ROLLBACK');
            throw error;    //bubble up cho controller bat
        } finally {
            client.release();
        }
    },

    updateWorkspace: async (id: number, name: string, ownerId: number) : Promise<WorkspaceRow> => {
        const workspace = await workspaceModel.update(id, name, ownerId);
        if (!workspace){
            throw { status: 404, message: 'Workspace not found or access denied.' };
        }
        return workspace;
    },

    deleteWorkspace: async (id: number, ownerId: number) : Promise<WorkspaceRow> => {
        const deleted = await workspaceModel.delete(id, ownerId);
        if (!deleted){
            throw { status: 404, message: 'Workspace not found or access denied.' };
        }
        return deleted;
    },
};

export default workspaceService;