import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authSessionModel from '../models/authSessionModel';

interface JwtPayload {
    id: number;
    iat: number;
    exp: number;
    sid: string;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized. Token not found.' });
        return;     //khong co token -> return
    }

    let decoded: JwtPayload;

    //co token -> tach ra va verify
    try {
        const token = authorization.slice('Bearer '.length);
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is not defined.');

        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

        if (
            typeof payload === 'string' ||
            !Number.isSafeInteger(payload.id) || payload.id <= 0 ||
            typeof payload.sid !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sid) ||
            !Number.isSafeInteger(payload.iat) ||
            !Number.isSafeInteger(payload.exp)
        ) {
            throw new jwt.JsonWebTokenError('Invalid access token payload.');
        }

        decoded = payload as JwtPayload;
    } catch (error) {
        const expired = error instanceof jwt.TokenExpiredError;
        res.status(401).json({
            code: expired ? 'ACCESS_TOKEN_EXPIRED' : 'ACCESS_TOKEN_INVALID',
            message: expired ? 'Access token expired.' : 'Invalid access token.'
        });
        return;
    }

    try {
        if (!(await authSessionModel.isActive(decoded.sid, decoded.id))) {
            res.status(401).json({
                code: 'SESSION_REVOKED',
                message: 'Session is no longer active. Please log in again.'
            });
            return;
        }
    } catch (error) {
        console.error('Session lookup failed:', error);
        res.status(500).json({ message: 'Internal server error.' });
        return;
    }

    req.user = decoded;
    next();
};