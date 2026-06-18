import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import pool from '../config/db';

export const createBoard = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {name} = req.body;
        const workspaceId = req.params.workspaceId || req.body.workspace_id;
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

        await pool.query('BEGIN');

        const query1 = `
            INSERT INTO boards (name, workspace_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values1 = [name, workspaceId];
        const boardResult = await pool.query(query1, values1);
        const newBoard = boardResult.rows[0];

        const query2 = `
            INSERT INTO board_members (board_id, user_id, role, joined_at)
            VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP);
        `;
        const values2 = [newBoard.id, userId];
        await pool.query(query2, values2);

        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Board created successfully.',
            board : newBoard
        });
    } catch (error){
        await pool.query('ROLLBACK');

        console.error('createBoard error:', error);
        res.status(500).json({
            message: 'Internal server error.'
        });
    }
};

export const getBoardByWorkspace = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const workspaceId = req.params.workspaceId || req.body.workspace_id;
        const userId = req.user!.id;
        const query = `
            SELECT b.id, b.name, b.updated_at, b.bg_color, b.bg_image_url, bm.role
            FROM boards b
                JOIN board_members bm ON b.id = bm.board_id
                WHERE b.workspace_id = $1 AND bm.user_id = $2
            ORDER BY b.updated_at DESC;
        `;

        const result = await pool.query(query, [workspaceId, userId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getBoardByWorkspace error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export const getBoardById = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const userId = req.user!.id;
        const boardId = req.params.id;

        const query = `
            SELECT b.id, b.name, b.workspace_id, b.created_at, b.updated_at, b.bg_color, b.bg_image_url, bm.role
            FROM boards b
                JOIN board_members bm ON b.id = bm.board_id
                WHERE b.id = $1 AND bm.user_id = $2;
        `;
        const result = await pool.query(query, [boardId, userId]);

        if (result.rows.length === 0){
            res.status(404).json({
                message: 'Board not found or access denied.'
            });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('getBoardById error:', error);
        res.status(500).json({
            message: 'Internal server error.'
        });
    }
};

export const updateBoard = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const id = req.params.id;
        const { name, bg_color, bg_image_url } = req.body;
        const userId = req.user!.id;

        if (!name) {
            res.status(400).json({
                message: 'Board name is required'
            });
            return;
        }

        const query = `
            UPDATE boards
            SET name = $1, bg_color = $2, bg_image_url = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND EXISTS (
                    SELECT 1 FROM board_members bm
                    WHERE bm.board_id = $4
                        AND bm.user_id = $5
                        AND bm.role IN ('admin', 'owner')
            )
            RETURNING *;
            `;

        const result = await pool.query(query, [name, bg_color, bg_image_url, id, userId]);
        if (result.rows.length === 0){
            res.status(404).json({
                message: 'Board not found or access denied.'
            });
            return;
        }

        res.status(200).json({
            message: 'Updated succesfully',
            board: result.rows[0]
        });
    } catch (error){
        console.error('updateBoard error:', error);
        res.status(500).json({
            message: 'Internal server error.' 
        });
    }
};

export const deleteBoard = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const id = req.params.id;
        const userId = req.user!.id;

        const query = `
            DELETE FROM boards
            WHERE id = $1 AND EXISTS (
                SELECT 1 FROM board_members
                WHERE board_id = $1
                    AND user_id = $2
                    AND role = 'owner'
            )
            RETURNING id, name;
        `;
        
        const result = await pool.query(query, [id, userId]);
        if (result.rows.length === 0){
            res.status(404).json({
                message: 'Board not found.'
            });
            return;
        }

        res.status(200).json({
            message: 'Board deleted successfully.',
            board: result.rows[0]
        });
    } catch (error){
        console.error('deleteBoard error:', error);
        res.status(500).json({
            message: 'Internal server error.' 
        });
    }
};