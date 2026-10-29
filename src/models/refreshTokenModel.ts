import type { PoolClient } from 'pg';

export interface RefreshTokenRow {
    id: string;
    session_id: string;
    token_hash: string;
    created_at: Date;
    used_at: Date | null;
}

const refreshTokenModel = {
    create: async (sessionId: string, tokenHash: string, client: PoolClient): Promise<RefreshTokenRow> => {
        const result = await client.query<RefreshTokenRow>(
            `
                INSERT INTO refresh_tokens (session_id, token_hash)
                VALUES ($1, $2)
                RETURNING id, session_id, token_hash, created_at, used_at;
            `,
            [sessionId, tokenHash]
        );

        return result.rows[0];
    },

    findByHash: async (tokenHash: string, client: PoolClient): Promise<RefreshTokenRow | null> => {
        const result = await client.query<RefreshTokenRow>(
            `
                SELECT id, session_id, token_hash, created_at, used_at
                FROM refresh_tokens
                WHERE token_hash = $1;
            `,
            [tokenHash]
        );

        return result.rows[0] ?? null;
    },

    markUsed: async (tokenId: string, client: PoolClient): Promise<boolean> => {
        const result = await client.query(
            `
                UPDATE refresh_tokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE id = $1
                    AND used_at IS NULL;
            `,
            [tokenId]
        );

        return result.rowCount === 1;
    }
};

export default refreshTokenModel;