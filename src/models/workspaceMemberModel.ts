import pool from '../config/db';

export interface WorkspaceMemberRow {
    workspace_id: number;
    user_id: number;    // INT trong DB
    role: string;
}

const workspaceMemberModel = {
    addOwner: async (workspaceId: number, ownerId: number): Promise<void> => {
        const query = `
            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES ($1, $2, 'owner')
        `;
        await pool.query(query, [workspaceId, ownerId]);
    },
};

export default workspaceMemberModel;