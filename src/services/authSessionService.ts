import type { PoolClient } from 'pg';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import authSessionModel, { AuthSessionRow} from '../models/authSessionModel';
import refreshTokenModel from '../models/refreshTokenModel';
import { generateRefreshToken, hashRefreshToken} from '../utils/tokenUtils';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionTokens {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
}

//phan biet loi xac thuc voi loi ky thuat
export type RefreshResult =
    | { ok: true; tokens: SessionTokens }   //refresh thanh cong
    | { ok: false; reason: 'invalid' | 'expired' | 'reused' };  //refresh bi tu choi

const isRefreshToken = (value: unknown): value is string => {
    return typeof value === 'string'
        && /^[A-Za-z0-9_-]{43}$/.test(value);
};

//dung chung cho JWT va luu hash cua refresh token moi
const issueTokens = async (session: AuthSessionRow, client: PoolClient): Promise<SessionTokens> => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined.');
    }

    //Math.min() dam bao access token song toi da 15p, khong vuot thoi han phien
    const accessExpiresAt = Math.min(
        Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
        Math.floor(session.expires_at.getTime() / 1000)
    );

    const accessToken = jwt.sign(
        {
            id: session.user_id,
            sid: session.id,
            exp: accessExpiresAt
        },
        secret,
        { algorithm: 'HS256' }
    );

    const refreshToken = generateRefreshToken();

    await refreshTokenModel.create(
        session.id,
        hashRefreshToken(refreshToken),
        client
    );

    return {
        accessToken,
        refreshToken,
        refreshTokenExpiresAt: session.expires_at
    };
};

const authSessionService = {
    createSession: async (userId: number): Promise<SessionTokens> => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
            const session = await authSessionModel.create(userId, expiresAt, client);
            const tokens = await issueTokens(session, client);

            await client.query('COMMIT');

            return tokens;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    refreshSession: async (rawRefreshToken: unknown): Promise<RefreshResult> => {
        if (!isRefreshToken(rawRefreshToken)) {
            return { ok: false, reason: 'invalid' };
        }

        const tokenHash = hashRefreshToken(rawRefreshToken);
        const client = await pool.connect();

        try {
            await client.query(
                'BEGIN ISOLATION LEVEL READ COMMITTED'
            );

            const initialToken = await refreshTokenModel.findByHash(tokenHash, client);
            //findByHash: dung de biet token thuoc phien nao

            if (!initialToken) {
                await client.query('ROLLBACK');
                return { ok: false, reason: 'invalid' };
            }

            const session = await authSessionModel.findByIdForUpdate(initialToken.session_id, client);

            if (!session || session.revoked_at !== null) {
                await client.query('ROLLBACK');
                return { ok: false, reason: 'invalid' };
            }

            if (session.expires_at.getTime() <= Date.now()) {
                await client.query('ROLLBACK');
                return { ok: false, reason: 'expired' };
            }

            // Doc lai sau khi da lay khoa phien
            const currentToken = await refreshTokenModel.findByHash(tokenHash, client);

            if (!currentToken || currentToken.session_id !== session.id){
                await client.query('ROLLBACK');
                return { ok: false, reason: 'invalid' };
            }

            if (currentToken.used_at !== null || !(await refreshTokenModel.markUsed(currentToken.id, client))) {
                await authSessionModel.revoke(session.id, client);

                // Phai luu viec thu hoi truoc khi bao refresh that bai
                await client.query('COMMIT');
                return { ok: false, reason: 'reused' };
            }

            const tokens = await issueTokens(session, client);
            await client.query('COMMIT');

            return { ok: true, tokens };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    revokeSession: async (rawRefreshToken: unknown): Promise<void> => {
        if (!isRefreshToken(rawRefreshToken)) {
            return;
        }

        const client = await pool.connect();
        try {
            await client.query(
                'BEGIN ISOLATION LEVEL READ COMMITTED'
            );

            const token = await refreshTokenModel.findByHash(hashRefreshToken(rawRefreshToken), client);

            if (token) {
                const session = await authSessionModel.findByIdForUpdate(token.session_id, client);

                if (session) {
                    await authSessionModel.revoke(session.id, client);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

export default authSessionService;