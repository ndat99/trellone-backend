import pool from '../config/db';

export interface TaskMemberRow {
    task_id: number;
    user_id: number;
    username: string;
    name: string;
    avatar_url: string | null;
}

const taskMemberModel = {
    findByTask: async (taskId: number): Promise<TaskMemberRow[]> => {
        const result = await pool.query(`
            SELECT tm.task_id, tm.user_id, u.username, u.name, u.avatar_url
            FROM task_members tm
            JOIN users u ON u.id = tm.user_id
            WHERE tm.task_id = $1
            `, [taskId]
        );
        return result.rows;
    },

    add: async (taskId: number, userId: number): Promise<void> => {
        await pool.query(`
            INSERT INTO task_members
            (task_id, user_id) VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            `, [taskId, userId]
        );
    },

    remove: async (taskId: number, userId: number): Promise<boolean> => {
        const result = await pool.query(`
            DELETE FROM task_members
            WHERE task_id = $1 AND user_id = $2
            `, [taskId, userId]
        );
        return (result.rowCount ?? 0) > 0;
    },

    isMember: async (taskId: number, userId: number) : Promise<boolean> => {
        const result = await pool.query(`
            SELECT 1 FROM task_members WHERE task_id = $1 AND user_id = $2
            `, [taskId, userId]
        );
        return result.rows.length > 0;
    }
};

export default taskMemberModel;