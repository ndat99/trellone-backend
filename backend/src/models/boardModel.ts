import pool from '../config/db';

export interface BoardRow {
    id: number;
    name: string,
    workspace_id: number,
    created_at: Date,
    updated_at: Date,
    bg_color: string,
    bg_image_url: string
}

export type BoardWithRole = BoardRow & { role: string };

const boardModel = {
    findById: async (userId: number, boardId: number): Promise<BoardWithRole | null> => {
        const query = `
            SELECT b.id, b.name, b.workspace_id, b.created_at, b.updated_at, b.bg_color, b.bg_image_url, bm.role
            FROM boards b
                JOIN board_members bm ON b.id = bm.board_id
                WHERE b.id = $1 AND bm.user_id = $2;
        `;
        const result = await pool.query(query, [boardId, userId]);
        return result.rows[0] ?? null;
    },

    findByWorkspace: async (userId: number, workspaceId: number) : Promise<BoardWithRole[]> => {
        const query = `
            SELECT b.id, b.name, b.updated_at, b.bg_color, b.bg_image_url, b.created_at, bm.role
            FROM boards b
                JOIN board_members bm ON b.id = bm.board_id
                WHERE b.workspace_id = $1 AND bm.user_id = $2
            ORDER BY b.updated_at DESC;
        `;

        const result = await pool.query(query, [workspaceId, userId]);
        return result.rows;
    },

    create: async (name: string, workspaceId: number) : Promise<BoardRow> => {
        const query = `
            INSERT INTO boards (name, workspace_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values = [name, workspaceId];
        const boardResult = await pool.query(query, values);
        return boardResult.rows[0];
    },

    update: async (name: string, bg_color: string, bg_image_url: string, id: number, userId: number) : Promise<BoardRow | null>=> {
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
        return result.rows[0] ?? null;
    },

    delete: async (id: number, userId: number) : Promise<BoardRow | null> => {
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
        return result.rows[0] ?? null;
    },
};

export default boardModel;