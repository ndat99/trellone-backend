import pool from '../config/db';

export interface CommentRow {
    id: number,
    task_id: number,
    content: string,
    user_id: number,
    username: string,
    name: string,
    avatar_url?: string | null,
    created_at: Date,
    updated_at: Date
}

const commentModel = {
    findByTask: async (taskId: number) : Promise<CommentRow[]> => {
        const query = `
            SELECT c.id, c.task_id, c.content, c.user_id, c.created_at, c.updated_at,
                    u.username, u.name, u.avatar_url
            FROM comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.task_id = $1
            ORDER BY c.created_at DESC
        `;
        const result = await pool.query(query, [taskId]);
        return result.rows;
    },

    findById: async (commentId: number) : Promise<CommentRow | null> => {
        const query = `
            SELECT id, content, user_id, task_id, created_at, updated_at
            FROM comments
            WHERE id = $1;
        `;
        const result = await pool.query(query, [commentId]);
        return result.rows[0];
    },

    add: async (taskId: number, userId: number, content: string) : Promise<CommentRow> => {
        const query = `
            INSERT INTO comments (task_id, user_id, content, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const result = await pool.query(query, [taskId, userId, content]);
        const newChecklist = result.rows[0];

        return newChecklist;
    },

    edit: async (commentId: number, taskId: number, content: string) : Promise<CommentRow | null> => {
        const query = `
            UPDATE comments
            SET content = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND task_id = $3
            RETURNING id, content, user_id, task_id, created_at, updated_at;
        `;
        const result = await pool.query(query, [content, commentId, taskId]);
        return result.rows[0] ?? null;
    },

    delete: async (commentId: number, taskId: number) : Promise<CommentRow | null> =>{
        const deleteResult = await pool.query(
            `DELETE FROM comments WHERE id = $1 AND task_id = $2
            RETURNING id, content, user_id, task_id, created_at, updated_at`, [commentId, taskId]
        );
        return deleteResult.rows[0] ?? null;
    },

    isOwnedByUser: async (commentId: number, userId: number) : Promise<boolean> => {
        const result = await pool.query(`
            SELECT 1 FROM comments
            WHERE id = $1 AND user_id = $2
            `, [commentId, userId]);
        return result.rows.length > 0;
    }
};

export default commentModel;