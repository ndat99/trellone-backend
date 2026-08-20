import pool from '../config/db';

export interface LabelRow {
    id: number,
    board_id: number,
    name: string,
    color: string
}

const labelModel = {
    findByBoard: async (boardId: number) : Promise<LabelRow[]> => {
        const query = `
            SELECT id, name, color
            FROM labels
            WHERE board_id = $1;
        `;
        const result = await pool.query(query, [boardId]);
        return result.rows;
    },

    findBoardIdByLabelId: async (labelId: number) : Promise<number | null> => {
        const result = await pool.query(
            `SELECT board_id FROM labels WHERE id = $1`, [labelId]
        );
        return result.rows[0]?.board_id ?? null
    },

    create: async (boardId: number, name: string, color: string) : Promise<LabelRow> => {
        const query = `
            INSERT INTO labels (board_id, name, color)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await pool.query(query, [boardId, name, color]);
        const newLabel = result.rows[0];

        return newLabel;
    },

    rename: async (name: string, labelId: number, boardId: number) : Promise<LabelRow | null> => {
        const query = `
            UPDATE labels
            SET name = $1
            WHERE id = $2 AND board_id = $3
            RETURNING id, name, color;
        `;
        const result = await pool.query(query, [name, labelId, boardId]);
        return result.rows[0] ?? null;
    },

    delete: async (labelId: number, boardId: number) : Promise<LabelRow | null> =>{
        const deleteResult = await pool.query(
            `DELETE FROM labels WHERE id = $1 AND board_id = $2
            RETURNING id, name, color`, [labelId, boardId]
        );
        return deleteResult.rows[0] ?? null;
    },
};

export default labelModel;