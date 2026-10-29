import type {
    Request,
    Response,
    NextFunction
} from 'express';

import { AUTH_ALLOWED_ORIGINS } from '../config/auth';

export const requireTrustedOrigin = (req: Request, res: Response, next: NextFunction): void =>{
    const origin = req.get('Origin');

    if (!origin || !AUTH_ALLOWED_ORIGINS.includes(origin)) {
        res.status(403).json({
            message: 'Untrusted request origin.'
        });
        return;
    }

    next();
};