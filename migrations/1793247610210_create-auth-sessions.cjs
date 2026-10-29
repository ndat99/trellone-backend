exports.up = (pgm) => {
    pgm.sql(`
        CREATE TABLE auth_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ,

            CONSTRAINT chk_auth_sessions_expiry
                CHECK (expires_at > created_at)
        );

        CREATE INDEX idx_auth_sessions_user_id
            ON auth_sessions(user_id);

        CREATE TABLE refresh_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL
                REFERENCES auth_sessions(id) ON DELETE CASCADE,

            token_hash CHAR(64) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            used_at TIMESTAMPTZ
        );

        CREATE INDEX idx_refresh_tokens_session_id
            ON refresh_tokens(session_id);

        CREATE UNIQUE INDEX uq_refresh_tokens_unused_session
            ON refresh_tokens(session_id)
            WHERE used_at IS NULL;
    `);
};

exports.down = (pgm) => {
    pgm.sql(`
        DROP TABLE refresh_tokens;
        DROP TABLE auth_sessions;
    `);
};