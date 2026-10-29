import userModel, { UserRow, UpdateProfileFields} from '../models/userModel';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import authSessionModel from '../models/authSessionModel';

function fail(status: number, message: string): never {
    throw { status, message };
}

function readBody( input: unknown, allowed: string[]): Record<string, unknown> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        fail(400, 'Request body must be a JSON object.');
    }   //tu choi body khong phai object, body rong va key ngoai danh sach
        //chan viec gui kem id password_hash hoac truong khong thuoc hop dong API

    const body = input as Record<string, unknown>;
    const keys = Object.keys(body);

    if (!keys.length || keys.some(key => !allowed.includes(key))) {
        fail(400, 'Missing or unsupported fields.');
    }

    return body;
}

const userService = {
    //cap nhat profile
    updateProfile: async (userId: number, input: unknown): Promise<UserRow> => {
        const body = readBody(input, ['name', 'avatar_url']);
        const fields: UpdateProfileFields = {};

        if (Object.prototype.hasOwnProperty.call(body, 'name')) {
            const value = body.name;
            if (typeof value !== 'string') {
                fail(400, 'Name must be a string.');
            }

            const name = value.trim();
            if (!name || [...name].length > 100) {
                fail(400, 'Name must contain 1–100 characters.');
            }
            fields.name = name;
        }

        if (Object.prototype.hasOwnProperty.call(body, 'avatar_url')) {
            const value = body.avatar_url;

            if (value === null) {
                fields.avatar_url = null;
            } else {
                if (typeof value !== 'string' || !value.trim() ||
                    value.length > 2048) {
                    fail(400, 'Avatar must be an HTTP(S) URL or null.');
                }

                let url: URL;
                try {
                    url = new URL(value.trim());
                } catch {
                    fail(400, 'Invalid avatar URL.');
                }

                if (!['http:', 'https:'].includes(url.protocol) ||
                    url.username || url.password) {
                    fail(400, 'Avatar must be an HTTP(S) URL without credentials.');
                }

                fields.avatar_url = url.toString();
            }
        }

        const user = await userModel.updateProfile(userId, fields);
        if (!user) fail(404, 'User not found.');
        return user;
    },

    //doi mat khau
    changePassword: async (userId: number, input: unknown): Promise<void> => {
        const body = readBody(input, ['currentPassword', 'newPassword']);
        const { currentPassword, newPassword } = body;

        if (typeof currentPassword !== 'string' || !currentPassword ||
            Buffer.byteLength(currentPassword, 'utf8') > 1024) {
            fail(400, 'Current password is required and must not exceed 1024 bytes.');
        }

        if (typeof newPassword !== 'string' ||
            [...newPassword].length < 15 ||
            !newPassword.trim() ||
            Buffer.byteLength(newPassword, 'utf8') > 72) {
            fail(400, 'New password must contain at least 15 characters and at most 72 UTF-8 bytes.');
        }

        const user = await userModel.getPasswordById(userId);
        if (!user) fail(404, 'User not found.');

        if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
            fail(400, 'Current password is incorrect.');
        }

        if (await bcrypt.compare(newPassword, user.password_hash)) {
            fail(400, 'New password must differ from the current password.');
        }

        // BCrypt chay truoc transaction de tranh giu khoa DB qua lau
        const newHash = await bcrypt.hash(newPassword, 10);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const updated = await userModel.updatePasswordIfCurrent(
                userId, user.password_hash, newHash, client
            );
            if (!updated) {
                fail(409, 'Password changed concurrently. Please log in again.');
            }
            await authSessionModel.revokeAllForUser(userId, client);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
};

export default userService;
