import pool from '../config/db';

export interface TaskLabelRow {
    task_id: number;
    label_id: number;
    name: string;
    color: string;
}

const TaskLabelModel = {
    findByTask: async (taskId: number): Promise<TaskLabelRow[]> => {
        const result = await pool.query(`
            SELECT tl.task_id, tl.label_id, lb.name, lb.color
            FROM task_labels tl
            JOIN labels lb ON lb.id = tl.label_id
            WHERE tl.task_id = $1
            `, [taskId]
        );
        return result.rows;
    },

    add: async (taskId: number, labelId: number): Promise<void> => {
        await pool.query(`
            INSERT INTO task_labels
            (task_id, label_id) VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            `, [taskId, labelId]
        );
    },

    remove: async (taskId: number, labelId: number): Promise<boolean> => {
        const result = await pool.query(`
            DELETE FROM task_labels
            WHERE task_id = $1 AND label_id = $2
            `, [taskId, labelId]
        );
        return (result.rowCount ?? 0) > 0;
    },
};

export default TaskLabelModel;