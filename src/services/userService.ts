import userModel, { UserRow, UpdateProfileFields} from '../models/userModel';

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
};

export default userService;
