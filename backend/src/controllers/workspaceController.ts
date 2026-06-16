import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import pool from '../config/db';

export const createWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const name = req.body.name;
        const ownerId = req.user.id;

        if (!name){
            res.status(400).json({
                message: 'Workspace name is required.'
            });
        }

        const query = `
            INSERT INTO workspaces (name, owner_id)
            VALUES ($1, $2)
            RETURNING *;
        `;

        const values = [name, ownerId];
        const result = await pool.query(query, values);

        const newWorkspace = result.rows[0];
        res.status(201).json({
            message: 'Workspace created successfully.',
            workspace: newWorkspace
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error:', error
        });
    }
};


export const getWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const userId = req.user.id; //lay id nguoi dung tu token
        const query = `
            SELECT id, name, created_at, updated_at
            FROM workspaces
            WHERE owner_id = $1
            ORDER BY created_at DESC;
        `;
        
        const result = await pool.query(query, [userId]);
        
        res.status(200).json(result.rows)
    } catch (error) {
        res.status(500).json({
            message: 'Server error:', error
        });
    }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const id = req.params.id;  //lay tu id cua workspace tren URL
        const name = req.body.name; //lay ten moi tu body
        const userId = req.user.id;

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
        res.status(500).json({
            message: 'Server error:', error
        });
    }
};


export const deleteWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const id = req.params.id;
        const userId= req.user.id;

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
        res.status(500).json({
            message: 'Server error.', error
        });
    }
}