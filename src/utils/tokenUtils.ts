import { createHash, randomBytes } from 'node:crypto';

export const generateRefreshToken = (): string => {
    return randomBytes(32).toString('base64url');
};

export const hashRefreshToken = (token: string): string => {
    return createHash('sha256')
        .update(token)
        .digest('hex');
};