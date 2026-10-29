import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


interface JwtPayload {
    id: number;
    iat: number;
    exp: number;
    sid: string;
}

//extends interface cua Express
export interface AuthRequest extends Request {
    user?: JwtPayload;
};

export const protect = (req: AuthRequest, res: Response, next: NextFunction) : void => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith(`Bearer `)){ 
        res.status(401).json({
            message: `Unauthorized. Token not found.`
        });
        return;  //khong co token -> return
    }
    
    //co token -> tach ra va verify
    try{
        const token = req.headers.authorization.split(' ')[1];    //tach, bo 'Bearer'
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined!');

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS256'] }
        );

        if (
            typeof decoded === 'string' ||
            !Number.isSafeInteger(decoded.id) ||
            decoded.id <= 0 ||
            typeof decoded.sid !== 'string' ||
            typeof decoded.iat !== 'number' ||
            typeof decoded.exp !== 'number'
        ) {
            throw new jwt.JsonWebTokenError(
                'Invalid access token payload.'
            );
        }

        req.user = decoded as JwtPayload;
        next();
    } catch (error) {
        const expired = error instanceof jwt.TokenExpiredError;

        res.status(401).json({
            code: expired
                ? 'ACCESS_TOKEN_EXPIRED'
                : 'ACCESS_TOKEN_INVALID',
            message: expired
                ? 'Access token expired.'
                : 'Invalid access token.'
        });
        return;
    }
}