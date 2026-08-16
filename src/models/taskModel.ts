import pool from '../config/db';

export interface TaskRow {
    id: number,
    name: string,
    description: string,
    position: number,
    created_by: number,
    is_done: boolean,
    list_id: number,
    start_date: Date,
    due_date: Date,
    created_at: Date,
    updated_at: Date,
    cover_color: string,
    is_archived: boolean
}

const taskModel = {
    findByList: async (listId: number): Promise<TaskRow[]> => {
        const query = `
            SELECT id, name, position, is_done, created_at, updated_at, cover_color, is_archived
            FROM tasks
            WHERE list_id = $1 AND is_archived = False
            ORDER BY position ASC;
        `;
        const tasks = await pool.query(query, [listId]);
        return tasks.rows;
    },

    findById: async (listId: number, taskId: number): Promise<TaskRow | null> => {
        const query = `
            SELECT * FROM tasks WHERE id = $1 AND list_id = $2;
        `;
        const task = await pool.query(query, [taskId, listId]);
        return task.rows[0] ?? null;
    },
    
    findByTaskId: async (taskId: number): Promise<TaskRow | null> => {
        const result = await pool.query(
            `SELECT * FROM tasks WHERE id = $1`,
            [taskId]
        );
        return result.rows[0] ?? null;
    },

    findNextPosition: async (listId: number) : Promise<number> => {
        const query = `
            SELECT COALESCE(MAX(position), -1) +1 AS next_position
            FROM tasks
            WHERE list_id = $1;
        `;
        const positionResult = await pool.query(query, [listId]);
        const nextPosition = positionResult.rows[0].next_position;

        return nextPosition;
    },

    create: async (listId: number, name: string, nextPosition: number, userId: number) : Promise<TaskRow> => {
        const query = `
            INSERT INTO tasks (list_id, name, position, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const result = await pool.query(query, [listId, name, nextPosition, userId]);
        const newTask = result.rows[0];

        return newTask;
    },

    delete: async (taskId: number, listId: number) : Promise<TaskRow | null> =>{
        const deleteResult = await pool.query(
            `DELETE FROM tasks WHERE id = $1 AND list_id = $2
            RETURNING id, name, position`, [taskId, listId]
        );
        return deleteResult.rows[0] ?? null;
    },

    archive: async (taskId: number, listId: number) : Promise<TaskRow | null> =>{
        const archivedResult = await pool.query(
            `UPDATE tasks
            SET is_archived = true
            WHERE id = $1
                AND list_id = $2
                AND is_archived = false
            RETURNING id, name, position`, [taskId, listId]
        );
        return archivedResult.rows[0] ?? null;
    },

    update: async (
        taskId: number,
        listId: number,
        fields: {
            name?: string,
            description?: string,
            is_done?: boolean,
            start_date?: string | null,
            due_date?: string | null,
            cover_color?: string | null
        }
    ) : Promise<TaskRow | null> => {
        const query=`
            UPDATE tasks
            SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                is_done     = COALESCE($3, is_done),
                due_date    = COALESCE($4, due_date),
                start_date  = COALESCE($5, start_date),
                cover_color = COALESCE($6, cover_color),
                updated_at  = CURRENT_TIMESTAMP
            WHERE id = $7 AND list_id = $8
            RETURNING id, name, description, is_done, due_date, start_date, cover_color, updated_at;
        `;
        const result = await pool.query(query, [
            fields.name         ?? null,
            fields.description  ?? null,
            fields.is_done      ?? null,
            fields.due_date     ?? null,
            fields.start_date   ?? null,
            fields.cover_color  ?? null,
            taskId,
            listId
        ]);
        return result.rows[0] ?? null;
    },

    updatePositionAfterDelete: async (listId: number, deletedPosition: number) : Promise<void> => {
        await pool.query(
            `UPDATE tasks
            SET position = position - 1
            WHERE list_id = $1
            AND position > $2`, [listId, deletedPosition]
        );
    },

    findMaxPosition: async (listId: number) : Promise<number> => {
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM tasks WHERE list_id = $1`, [listId]
        );
        const maxPosition = parseInt(countResult.rows[0].count) - 1;
        return maxPosition;
    },

    findCurrentPosition: async (taskId: number, listId: number) : Promise<number | null> => {
        const result = await pool.query(
            `SELECT position FROM tasks
            WHERE id = $1 AND list_id = $2`, [taskId, listId]
        );
        if (result.rows.length === 0){
            return null;
        }
        const currentPosition = result.rows[0].position;
        return currentPosition;
    },

    updatePositionAfterMove: async (listId: number, taskId: number, oldPosition: number, newPosition: number) : Promise<void> => {
        //neu di chuyen len tren (sang trai) -> cac list [newPos, oldPos) + 1
        if (newPosition < oldPosition){
            await pool.query(
                `UPDATE tasks SET position = position + 1
                WHERE list_id = $1
                    AND position >= $2
                    AND position < $3`, [listId, newPosition, oldPosition]
            );
        } else {    //neu di chuyen xuong duoi (sang phai) -> cac list (oldPos, newPos] - 1
            await pool.query(
                `UPDATE tasks SET position = position - 1
                WHERE list_id = $1
                    AND position > $2
                    AND position <= $3`, [listId, oldPosition, newPosition]
            );
        }

        //update position cua list can di chuyen
        await pool.query(`
            UPDATE tasks SET position = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND list_id = $3`, [newPosition, taskId, listId]
        );
    },

    emptyTargetPosition: async (listId: number, position: number): Promise<void> => {
        await pool.query(
            `UPDATE tasks SET position = position + 1
            WHERE list_id = $1 AND position >= $2`, [listId, position]
        );
    },

    moveToList: async (taskId: number, targetListId: number, newPosition: number) : Promise<TaskRow> => {
        const result = await pool.query(
            `UPDATE tasks
            SET list_id = $1, position = $2
            WHERE id = $3
            RETURNING id, name, position, list_id, updated_at`,
            [targetListId, newPosition, taskId]
        );
        return result.rows[0];
    }
};

export default taskModel;