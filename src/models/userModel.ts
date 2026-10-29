import pool from '../config/db';

//du lieu duoc phep tra ra API
export interface UserRow {
    id: number,
    username: string,
    name: string,
    email: string,
    avatar_url: string | null;
    created_at: Date,
}

// Chi dung noi bo khi xac thuc
export type UserWithPasswordRow = UserRow & {
    password_hash: string;
};

export interface PasswordRow {
    id: number;
    password_hash: string;
}

export interface UpdateProfileFields {
    name?: string;
    avatar_url?: string | null;
}

const userModel = {
    getById: async (userId: number): Promise<UserRow | null> => {
        const query = `
            SELECT id, username, email, name, avatar_url, created_at
            FROM users WHERE id = $1;
        `
        const user = await pool.query(query, [userId]);
        return user.rows[0] ?? null;
    },

    getByUsername: async (username: string) : Promise<UserWithPasswordRow| null> => {
        const query = `
            SELECT id, username, email, name, avatar_url, created_at, password_hash
            FROM users WHERE username = $1
        `;
        const result = await pool.query(query, [username]);
        return result.rows[0] ?? null;
    },

    create: async (username: string, email: string, passwordHash: string, name: string) : Promise<UserRow> => {
        const query = `
            INSERT INTO users (username, email, password_hash, name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, name, avatar_url, created_at;
        `;

        const values = [username, email, passwordHash, name];
        const result = await pool.query(query, values);

        return result.rows[0];
    },

    updateProfile: async (userId: number, fields: UpdateProfileFields): Promise<UserRow | null> =>{
        const query = `
            UPDATE users
            SET name = COALESCE($1, name),
                avatar_url = CASE
                    WHEN $2::boolean THEN $3::text
                    ELSE avatar_url
                END
            WHERE id = $4
            RETURNING id, username, email, name, avatar_url, created_at;
        `;

        const result = await pool.query(query, [
            fields.name ?? null,
            fields.avatar_url !== undefined,
            fields.avatar_url ?? null,
            userId
        ]);

        return result.rows[0] ?? null;
    }
};

export default userModel;