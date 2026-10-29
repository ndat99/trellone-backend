import { rateLimit } from 'express-rate-limit';
import type { AuthRequest } from './authMiddleware';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   //thoi gian dem request
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again later.'}
});

export const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many refresh attempts. Please try again later.'
    }
});

export const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    keyGenerator: (req: AuthRequest) => 'password-change:' + req.user!.id,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many password change attempts. Please try again later.'
    }
});