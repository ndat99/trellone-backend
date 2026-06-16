import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

//extends interface cua Express
export interface AuthRequest extends Request {
    user?: any;
};

export const protect = (req: AuthRequest, res: Response, next: NextFunction) : void => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith(`Bearer`)){   //check header ton tai va bat dau bang Bearer
        try{
            token = req.headers.authorization.split(' ')[1];    //tach, bo 'Bearer'
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);    //verify token
            req.user = decoded; //luu vao req.user (chua id) de controller su dung
            next();
        } catch (error) {
            res.status(401).json({
                message: `Unauthorized. Invalid token.`
            });
            return;
        }
    }

    if (!token){
        res.status(401).json({
            message: `Unauthorized. Token not found.`
        });
        return;
    }
}