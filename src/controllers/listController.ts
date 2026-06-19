import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import pool from '../config/db';

export const createList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const {name} = req.body;
        const boardId = req.params.boardId;
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

        const memberCheck = await pool.query(
            `SELECT 1 FROM board_members
            WHERE board_id = $1 AND user_id = $2`, [boardId, userId]
        );
        if (memberCheck.rows.length === 0) {
            res.status(403).json({
                message: 'Access denied. You are not a member of this board'
            });
            return;
        }
        
        const query1 = `
            SELECT COALESCE(MAX(position), -1) +1 AS next_position
            FROM lists
            WHERE board_id = $1;
        `;
        const positionResult = await pool.query(query1, [boardId]);
        const nextPosition = positionResult.rows[0].next_position;

        const query2 = `
            INSERT INTO lists (board_id, name, position, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const result = await pool.query(query2, [boardId, name, nextPosition]);
        const newList = result.rows[0];

        res.status(201).json({
            message: 'List created successfully.',
            list: newList
        });
    } catch (error){
        console.error('createList error:', error);
        res.status(500).json({
            message: 'Internal server error.'
        });
    }
}

export const getList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const boardId = req.params.boardId;
        const userId = req.user!.id;
        
        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const memberCheck = await pool.query(
            `SELECT 1 FROM board_members
            WHERE board_id = $1 AND user_id = $2`, [boardId, userId]
        );
        if (memberCheck.rows.length === 0) {
            res.status(403).json({
                message: 'Access denied. You are not a member of this board'
            });
            return;
        }
    
        const query = `
            SELECT id, name, position, created_at, updated_at
            FROM lists
            WHERE board_id = $1
            ORDER BY position ASC;
        `;
        const result = await pool.query(query, [boardId]);
    
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getList error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

export const updateListName = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const id = req.params.id;
        const { name } = req.body;
        const userId = req.user!.id;
        const boardId = req.params.boardId;

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

        const memberCheck = await pool.query(
            `SELECT 1 FROM board_members
            WHERE board_id = $1 AND user_id = $2`, [boardId, userId]
        );
        if (memberCheck.rows.length === 0) {
            res.status(403).json({
                message: 'Access denied. You are not a member of this board'
            });
            return;
        }

        const query = `
            UPDATE lists
            SET name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND board_id = $3
            RETURNING id, name, position;
        `;
        const result = await pool.query(query, [name, id, boardId]);
        if (result.rows.length === 0){
            res.status(404).json({
                message: 'List not found or access denied.'
            });
            return;
        }
        res.status(200).json({
            message: 'Updated successfully',
            list: result.rows[0]
        });
    } catch (error){
        console.error('updateListName error:', error);
        res.status(500).json({
            message: 'Internal server error.' 
        });
    }
};

export const deleteList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        const id = req.params.id;
        const userId = req.user!.id;
        const boardId = req.params.boardId;

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        const memberCheck = await pool.query(
            `SELECT 1 FROM board_members
            WHERE board_id = $1 AND user_id = $2
            AND role IN ('admin', 'owner')`, [boardId, userId]
        );
        if (memberCheck.rows.length === 0) {
            res.status(403).json({
                message: 'Access denied. You are not a member of this board'
            });
            return;
        }

        await pool.query('BEGIN');

        // const positionResult = await pool.query(`
        //     SELECT position FROM lists
        //     WHERE id = $1;
        // `, [id]);
        // const position = positionResult.rows[0].position;

        const deleteResult = await pool.query(
            `DELETE FROM lists WHERE id = $1 AND board_id = $2
            RETURNING id, name, position`, [id, boardId]
        );
        if (deleteResult.rows.length === 0){
            await pool.query('ROLLBACK');
            res.status(404).json({
                message: 'List not found.'
            });
            return;
        }
        const position = deleteResult.rows[0].position;

        await pool.query(
            `UPDATE lists
            SET position = position - 1
            WHERE board_id = $1
            AND position > $2`, [boardId, position]
        );

        await pool.query('COMMIT');
        res.status(200).json({
            message: 'Deleted successfully',
            list: deleteResult.rows[0]
        });
    } catch (error) {
        await pool.query('ROLLBACK');

        console.error('deleteList error:', error);
        res.status(500).json({
            message: 'Internal server error.'
        });
    }
};

export const reorderList = async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const id = req.params.id;
        const userId = req.user!.id;
        const boardId = req.params.boardId;
        const { position: newPosition } = req.body;

        if (!boardId){
            res.status(400).json({
                message: 'Choose a Board'
            });
            return;
        }

        //check xem member co thuoc board nay khong
        const memberCheck = await pool.query(
            `SELECT 1 FROM board_members
            WHERE board_id = $1 AND user_id = $2`, [boardId, userId]
        );
        if (memberCheck.rows.length === 0) {
            res.status(403).json({
                message: 'Access denied. You are not a member of this board'
            });
            return;
        }

        //validate newPosition hop le
        if (newPosition === undefined || newPosition === null) {
            res.status(400).json({ message: 'newPosition is required.' });
            return;
        }

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM lists WHERE board_id = $1`, [boardId]
        );
        const maxPosition = parseInt(countResult.rows[0].count) - 1;
        
        if (newPosition < 0 || newPosition > maxPosition) {
            res.status(400).json({
                message: 'Position out of range.'
            });
            return;
        }

        //lay old position
        const oldPositionResult = await pool.query(
            `SELECT position FROM lists
            WHERE id = $1 AND board_id = $2`, [id, boardId]
        );
        if (oldPositionResult.rows.length === 0){
            res.status(404).json({
                message: 'List not found or access denied.'
            });
            return;
        }
        const oldPosition = oldPositionResult.rows[0].position;
        if (oldPosition === newPosition) {
            res.status(200).json({
                message: 'No changes needed.'
            });
            return;
        }

        //transaction
        await pool.query('BEGIN');
        
        //neu di chuyen len tren (sang trai) -> cac list [newPos, oldPos) + 1
        if (newPosition < oldPosition){
            await pool.query(
                `UPDATE lists SET position = position + 1
                WHERE board_id = $1
                    AND position >= $2
                    AND position < $3`, [boardId, newPosition, oldPosition]
            );
        } else {    //neu di chuyen xuong duoi (sang phai) -> cac list (oldPos, newPos] - 1
            await pool.query(
                `UPDATE lists SET position = position - 1
                WHERE board_id = $1
                    AND position > $2
                    AND position <= $3`, [boardId, oldPosition, newPosition]
            );
        }

        //update position cua list can di chuyen
        await pool.query(`
            UPDATE lists SET position = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND board_id = $3`, [newPosition, id, boardId]
        );

        await pool.query('COMMIT');
        res.status(200).json({
            message: 'Reorder successfully.'
        });
    } catch (error){
        await pool.query('ROLLBACK');

        console.error('reorderList error:', error);
        res.status(500).json({
            message: 'Internal server error.'
        });
    }
};