import pool from '../config/db';

export interface UserRow {
    id: number,
    username: string,
    password_hash: string,
    name: string,
    email: string,
    created_at: Date,
    avatar_url: string 
}

const userModel = {
    getById: async (userId: number): Promise<UserRow | null> => {
        const query = `
            SELECT id, username, email, name, created_at FROM users WHERE id = $1;
        `
        const user = await pool.query(query, [userId]);
        return user.rows[0] ?? null;
    },

    getByUsername: async (username: string) : Promise<UserRow | null> => {
        const query = `
            SELECT id, username, email, name, password_hash FROM users WHERE username = $1
        `;
        const result = await pool.query(query, [username]);
        return result.rows[0] ?? null;
    },

    create: async (username: string, email: string, passwordHash: string, name: string) : Promise<UserRow> => {
        const query = `
            INSERT INTO users (username, email, password_hash, name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, name, created_at;
        `;

        const values = [username, email, passwordHash, name];
        const result = await pool.query(query, values);

        return result.rows[0];
    }
};

export default userModel;