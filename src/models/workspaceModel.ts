import pool from '../config/db';

export interface WorkspaceRow {
    id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
}

const workspaceModel = {
    findByUserId: async (userId: number): Promise<WorkspaceRow[]> => {
        const query =`
            SELECT id, name, created_at, updated_at
            FROM workspaces
            WHERE owner_id = $1
                OR id IN (SELECT workspace_id FROM
                workspace_members WHERE user_id = $1)
            ORDER BY created_at DESC;
        `
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    create: async (name: string, ownerId: number): Promise<WorkspaceRow> => {
        const query = `
            INSERT INTO workspaces (name, owner_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [name, ownerId]);
        return result.rows[0];
    },

    update: async (id: number, name: string, owner_id: number) : Promise<WorkspaceRow | null> => {
        const query = `
            UPDATE workspaces
            SET name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND owner_id = $3
            RETURNING *;
        `
        const result = await pool.query(query, [name, id, owner_id]);
        return result.rows[0] ?? null;
    },

    delete: async (id: number, owner_id: number) : Promise<WorkspaceRow | null> => {
        const query = `
            DELETE FROM workspaces
            WHERE id = $1 AND owner_id = $2
            RETURNING id, name;
        `;
        const result = await pool.query(query, [id, owner_id]);
        return result.rows[0] ?? null;
    },
};

export default workspaceModel;