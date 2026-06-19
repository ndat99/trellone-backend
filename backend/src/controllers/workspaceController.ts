import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import pool from '../config/db';

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

        await pool.query('BEGIN');  //bat dau transaction
        //tao workspace
        const query1 = `
            INSERT INTO workspaces (name, owner_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values1 = [name, ownerId];
        const workspaceResult = await pool.query(query1, values1);
        const newWorkspace = workspaceResult.rows[0];

        //them owner vao workspace_members
        const query2 = `
            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES ($1, $2, 'owner');
        `;
        const values2 = [newWorkspace.id, ownerId];
        await pool.query(query2, values2);

        await pool.query('COMMIT'); //thanh cong -> luu ca 2

        res.status(201).json({
            message: 'Workspace created successfully.',
            workspace: newWorkspace
        });
    } catch (error) {
        await pool.query('ROLLBACK');   //co loi -> huy ca 2

        console.error('createWorkspace error:', error);
        res.status(500).json({
            message: 'Internal server error.' 
        });
    }
};


export const getWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const userId = req.user!.id; //lay id nguoi dung tu token
        const query = `
            SELECT id, name, created_at, updated_at
            FROM workspaces
            WHERE owner_id = $1
                OR id IN (SELECT workspace_id FROM
                workspace_members WHERE user_id = $1)
            ORDER BY created_at DESC;
        `;
        
        const result = await pool.query(query, [userId]);
        
        res.status(200).json(result.rows)
    } catch (error) {
        console.error('getWorkspace error:', error);
        res.status(500).json({
            message: 'Internal server error.' 
        });
    }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const id = req.params.id;  //lay tu id cua workspace tren URL
        const name = req.body.name; //lay ten moi tu body
        const userId = req.user!.id;

        if (!name){
            res.status(400).json({
                message: 'Workspace name is required'
            });
            return;
        }

        const query = `
            UPDATE workspaces
            SET name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND owner_id = $3
            RETURNING *;
        `
        const result = await pool.query(query, [name, id, userId]);
        if (result.rows.length === 0){
            res.status(404).json({
                message: 'Workspace not found or access denied.'
            });
            return;
        }
        
        res.status(200).json({
            message: 'Updated successfully.',
            workspace: result.rows[0]
        });
    } catch (error) {
        console.error('updateWorkspace error:', error);
        res.status(500).json({
            message: 'Internal server error.' 
        });
    }
};


export const deleteWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const id = req.params.id;
        const userId= req.user!.id;

        const query = `
            DELETE FROM workspaces
            WHERE id = $1 AND owner_id = $2
            RETURNING id, name;
        `;
        
        const result = await pool.query(query, [id, userId]);
        if (result.rows.length === 0){
            res.status(404).json({
                message: 'Workspace not found.'
            });
            return;
        }

        res.status(200).json({
            message: 'Workspace deleted successfully.',
            workspace: result.rows[0]
        });
    } catch (error) {
        console.error('deleteWorkspace error:', error);
        res.status(500).json({
            message: 'Internal server error.' 
        });
    }
}