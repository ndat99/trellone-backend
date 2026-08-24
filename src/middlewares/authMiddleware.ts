import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


interface JwtPayload {
    id: number;
    iat: number;
    exp: number;
}

//extends interface cua Express
export interface AuthRequest extends Request {
    user?: JwtPayload;
};

export const protect = (req: AuthRequest, res: Response, next: NextFunction) : void => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith(`Bearer`)){ 
        res.status(401).json({
            message: `Unauthorized. Token not found.`
        });
        return;  //khong co token -> return
    }
    
    //co token -> tach ra va verify
    try{
        const token = req.headers.authorization.split(' ')[1];    //tach, bo 'Bearer'
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined!');

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;    //verify token
        req.user = decoded; //luu vao req.user (chua id) de controller su dung
        next();
    } catch (error) {
        res.status(401).json({
            message: `Unauthorized. Invalid token.`
        });
        return;
    }
}