import pool from '../config/db';

export interface WorkspaceMemberRow {
    workspace_id: number;
    user_id: number;
    role: string;
}

export type WorkspaceMemberWithUser = WorkspaceMemberRow & {
    username: string;
    name: string;
    avatar_url: string | null;
};

const workspaceMemberModel = {
    addOwner: async (workspaceId: number, ownerId: number): Promise<void> => {
        const query = `
            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES ($1, $2, 'owner')
        `;
        await pool.query(query, [workspaceId, ownerId]);
    },

    findByWorkspace: async (workspaceId: number): Promise<WorkspaceMemberWithUser[]> => {
        const query = `
            SELECT wm.workspace_id, wm.user_id, wm.role, u.username, u.name, u.avatar_url
            FROM workspace_members wm
            JOIN users u ON u.id = wm.user_id
            WHERE wm.workspace_id = $1
            ORDER BY wm.role ASC
        `;
        const result = await pool.query(query, [workspaceId]);
        return result.rows;
    },

    getMemberRole: async (workspaceId: number, userId: number): Promise<string | null> => {
        const result = await pool.query(`
            SELECT role FROM workspace_members
            WHERE workspace_id = $1 AND user_id = $2
            `, [workspaceId, userId]);
            return result.rows[0]?.role ?? null;
    },
    
    add: async (workspaceId: number, userId: number, role: string = 'member'): Promise<WorkspaceMemberRow> => {
        const result = await pool.query(`
            INSERT INTO workspace_members
            (workspace_id, user_id, role) VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING *
            `, [workspaceId, userId, role]
        );
        return result.rows[0];
    },

    remove: async (workspaceId: number, userId: number): Promise<boolean> => {
        const result = await pool.query(`
            DELETE FROM workspace_members
            WHERE workspace_id = $1 AND user_id = $2
            AND role != 'owner'
            `, [workspaceId, userId]
        );
        return (result.rowCount ?? 0) > 0;
    },

    updateRole: async (workspaceId: number, userId: number, newRole: string) : Promise<WorkspaceMemberRow | null> => {
        const result = await pool.query(`
            UPDATE workspace_members
            SET role = $1
            WHERE workspace_id = $2 AND user_id = $3
            RETURNING workspace_id, user_id, role
            `, [newRole, workspaceId, userId]
        );
        return result.rows[0] ?? null;
    }
};

export default workspaceMemberModel;