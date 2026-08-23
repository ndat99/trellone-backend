import pool from '../config/db';

export interface ChecklistRow {
    id: number,
    task_id: number,
    content: string,
    is_done: boolean,
    position: number,
}

const checklistModel = {
    findByTask: async (taskId: number) : Promise<ChecklistRow[]> => {
        const query = `
            SELECT id, content, is_done, position
            FROM checklist_items
            WHERE task_id = $1
            ORDER BY position ASC;
        `;
        const result = await pool.query(query, [taskId]);
        return result.rows;
    },

    findById: async (checklistId: number) : Promise<ChecklistRow | null> => {
        const query = `
            SELECT id, content, is_done, position
            FROM checklist_items
            WHERE id = $1;
        `;
        const result = await pool.query(query, [checklistId]);
        return result.rows[0];
    },

    findNextPosition: async (taskId: number) : Promise<number> => {
        const query = `
            SELECT COALESCE(MAX(position), -1) +1 AS next_position
            FROM checklist_items
            WHERE task_id = $1;
        `;
        const positionResult = await pool.query(query, [taskId]);
        const nextPosition = positionResult.rows[0].next_position;

        return nextPosition;
    },

    create: async (taskId: number, content: string, nextPosition: number) : Promise<ChecklistRow> => {
        const query = `
            INSERT INTO checklist_items (task_id, content, is_done, position)
            VALUES ($1, $2, False ,$3)
            RETURNING *;
        `;
        const result = await pool.query(query, [taskId, content, nextPosition]);
        const newChecklist = result.rows[0];

        return newChecklist;
    },

    updateItem: async (checklistId: number, taskId: number, content?: string, is_done?: boolean) : Promise<ChecklistRow | null> => {
        const query = `
            UPDATE checklist_items
            SET
                content = COALESCE($1, content),
                is_done = COALESCE($2, is_done)
            WHERE id = $3 AND task_id = $4
            RETURNING id, content, position;
        `;
        const result = await pool.query(query, [content ?? null, is_done ?? null, checklistId, taskId]);
        return result.rows[0] ?? null;
    },

    delete: async (checklistId: number, taskId: number) : Promise<ChecklistRow | null> =>{
        const deleteResult = await pool.query(
            `DELETE FROM checklist_items WHERE id = $1 AND task_id = $2
            RETURNING id, content, position`, [checklistId, taskId]
        );
        return deleteResult.rows[0] ?? null;
    },

    updatePositionAfterDelete: async (taskId: number, deletedPosition: number) : Promise<void> => {
        await pool.query(
            `UPDATE checklist_items
            SET position = position - 1
            WHERE task_id = $1
            AND position > $2`, [taskId, deletedPosition]
        );
    },

    findMaxPosition: async (taskId: number) : Promise<number> => {
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM checklist_items WHERE task_id = $1`, [taskId]
        );
        const maxPosition = parseInt(countResult.rows[0].count) - 1;
        return maxPosition;
    },

    findCurrentPosition: async (checklistId: number, taskId: number) : Promise<number | null> => {
        const result = await pool.query(
            `SELECT position FROM checklist_items
            WHERE id = $1 AND task_id = $2`, [checklistId, taskId]
        );
        if (result.rows.length === 0){
            return null;
        }
        const currentPosition = result.rows[0].position;
        return currentPosition;
    },

    updatePositionAfterMove: async (taskId: number, checklistId: number, oldPosition: number, newPosition: number) : Promise<void> => {
        //neu di chuyen len tren -> cac checklist [newPos, oldPos) + 1
        if (newPosition < oldPosition){
            await pool.query(
                `UPDATE checklist_items SET position = position + 1
                WHERE task_id = $1
                    AND position >= $2
                    AND position < $3`, [taskId, newPosition, oldPosition]
            );
        } else {    //neu di chuyen xuong duoi -> cac checklist (oldPos, newPos] - 1
            await pool.query(
                `UPDATE checklist_items SET position = position - 1
                WHERE task_id = $1
                    AND position > $2
                    AND position <= $3`, [taskId, oldPosition, newPosition]
            );
        }

        //update position cua checklist can di chuyen
        await pool.query(`
            UPDATE checklist_items SET position = $1
            WHERE id = $2 AND task_id = $3`, [newPosition, checklistId, taskId]
        );
    }
};

export default checklistModel;