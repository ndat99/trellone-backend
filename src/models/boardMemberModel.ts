import pool from '../config/db';

export interface BoardMemberRow {
    board_id: number,
    user_id: number,
    role: string,
    joined_at: Date
}

export type BoardMemberWithUser = BoardMemberRow & {
    username: string;
    name: string;
    avatar_url: string | null;
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

    findByBoard: async (boardId: number): Promise<BoardMemberWithUser[]> => {
        const query = `
            SELECT bm.board_id, bm.user_id, bm.role, bm.joined_at, u.username, u.name, u.avatar_url
            FROM board_members bm
            JOIN users u ON u.id = bm.user_id
            WHERE bm.board_id = $1
            ORDER BY bm.role ASC
        `;
        const result = await pool.query(query, [boardId]);
        return result.rows;
    },

    getMemberRole: async (boardId: number, userId: number): Promise<string | null> => {
        const result = await pool.query(`
            SELECT role FROM board_members
            WHERE board_id = $1 AND user_id = $2
            `, [boardId, userId]);
            return result.rows[0]?.role ?? null;
    },
    
    add: async (boardId: number, userId: number, role: string = 'member'): Promise<BoardMemberRow> => {
        const result = await pool.query(`
            INSERT INTO board_members
            (board_id, user_id, role, joined_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
            RETURNING *
            `, [boardId, userId, role]
        );
        return result.rows[0];
    },

    remove: async (boardId: number, userId: number): Promise<boolean> => {
        const result = await pool.query(`
            DELETE FROM board_members
            WHERE board_id = $1 AND user_id = $2
            AND role != 'owner'
            `, [boardId, userId]
        );
        return (result.rowCount ?? 0) > 0;
    },

    updateRole: async (boardId: number, userId: number, newRole: string) : Promise<BoardMemberRow | null> => {
        const result = await pool.query(`
            UPDATE board_members
            SET role = $1
            WHERE board_id = $2 AND user_id = $3
            RETURNING board_id, user_id, role
            `, [newRole, boardId, userId]
        );
        return result.rows[0] ?? null;
    }
};

export default boardMemberModel;