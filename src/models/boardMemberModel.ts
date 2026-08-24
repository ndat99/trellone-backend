import pool from '../config/db';

export interface BoardMemberRow {
    board_id: number,
    user_id: number,
    role: string
}

const boardMemberModel = {
    addOwner: async (boardId: number, userId: number) : Promise<void> => {
        const query = `
            INSERT INTO board_members (board_id, user_id, role, joined_at)
            VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP);
        `;
        const values = [boardId, userId];
        await pool.query(query, values);
    },

    memberCheck: async (boardId: number, userId: number) : Promise<boolean> => {
        const result = await pool.query(
            `SELECT 1 FROM board_members
            WHERE board_id = $1 AND user_id = $2`, [boardId, userId]
        );
        return result.rows.length > 0;
    },

    memberCheckByListId: async (listId: number, userId: number): Promise<boolean> => {
        const result = await pool.query(
            `SELECT 1 FROM board_members bm
            JOIN lists l ON bm.board_id = l.board_id
            WHERE l.id = $1 AND bm.user_id = $2`,
            [listId, userId]
        );
        return result.rows.length > 0;
    },

};

export default boardMemberModel;