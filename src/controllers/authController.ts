import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import authService from '../services/authService';


export const signup = async ( req: Request, res: Response) : Promise<void> => {
    try {
        const { username, email, password, name } = req.body;

        const newUser = await authService.signup(username, email, password, name);
        res.status(201).json({
            message: 'Account registered successfully!',
            user: newUser
        });
    } catch (error: any) {
        console.error('signup error:', error);

        //loi khac
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal Server error'
        });
    }
};

export const login = async (req: Request, res: Response) : Promise<void> => {
    try{
        const {username, password} = req.body;
        const {token, user} = await authService.login(username, password);

        res.status(200).json({
            message: 'Login successful',
            token,
            user
        });
        
    } catch (error: any){
        console.error('login error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal Server error'
        });
    };
}

export const getMe = async (req: AuthRequest, res: Response) : Promise<void> => {
    try{
        if (!req.user){
            res.status(401).json({
                message: 'Unauthorized.'
            });
            return;
        }
        const userId = req.user.id;
        const result = await authService.getMe(userId);
        
        res.status(200).json(result);
    } catch (error: any) {
        console.error('getMe error:', error);
        res.status(error.status ?? 500).json({
            message: error.message ?? 'Internal server error.' 
        });
    }
};