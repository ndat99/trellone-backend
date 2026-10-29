import type { PoolClient } from 'pg';

export interface AuthSessionRow {
    id: string;
    user_id: number;
    created_at: Date;
    expires_at: Date;
    revoked_at: Date | null;
}

const authSessionModel = {
    //tao phien khi login thanh cong
    create: async (userId: number, expiresAt: Date, client: PoolClient): Promise<AuthSessionRow> => {
        const result = await client.query<AuthSessionRow>(
            `
                INSERT INTO auth_sessions (user_id, expires_at)
                VALUES ($1, $2)
                RETURNING id, user_id, created_at, expires_at, revoked_at;
            `,
            [userId, expiresAt]
        );

        return result.rows[0];
    },

    //doc va khoa phien truoc khi xu ly refresh
    findByIdForUpdate: async (sessionId: string, client: PoolClient): Promise<AuthSessionRow | null> => {
        const result = await client.query<AuthSessionRow>(
            `
                SELECT id, user_id, created_at, expires_at, revoked_at
                FROM auth_sessions
                WHERE id = $1
                FOR UPDATE;
            `,
            [sessionId]
        );

        return result.rows[0] ?? null;
    },

    //thu hoi phien khi logout/reuse token
    revoke: async ( sessionId: string, client: PoolClient): Promise<void> => {
        await client.query(
            `
                UPDATE auth_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE id = $1
                    AND revoked_at IS NULL;
            `,
            [sessionId]
        );
    }
};

export default authSessionModel;