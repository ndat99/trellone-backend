import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import authService from '../services/authService';
import authSessionService from '../services/authSessionService';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS} from '../config/auth';


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
        const {username, password} = req.body ?? {};
        if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password){
            res.status(400).json({
                message: 'Username and password are required.'
            });
            return;
        }

        const result = await authService.login(username, password);

        res.cookie(
            REFRESH_COOKIE_NAME,
            result.refreshToken,
            {
                ...REFRESH_COOKIE_OPTIONS,
                expires: result.refreshTokenExpiresAt
            }
        );

        res.status(200).json({
            message: 'Login successful',
            accessToken: result.accessToken,
            user: result.user
        });
        
    } catch (error: any){
        console.error('login error:', error);
        const status = error.status === 401 ? 401 : 500;

        res.status(status).json({
            message: status === 401
                ? 'Invalid username or password.'
                : 'Internal server error.'
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

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await authSessionService.refreshSession(req.cookies?.[REFRESH_COOKIE_NAME]);
        if (!result.ok) {
            res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);

            res.status(401).json({
                code: 'REFRESH_TOKEN_INVALID',
                message: 'Please log in again.'
            });
            return;
        }

        res.cookie(
            REFRESH_COOKIE_NAME,
            result.tokens.refreshToken,
            {
                ...REFRESH_COOKIE_OPTIONS,
                expires: result.tokens.refreshTokenExpiresAt
            }
        );

        res.status(200).json({
            accessToken: result.tokens.accessToken  //chi tra access token
        });
    } catch (error) {
        console.error('refresh error:', error);

        res.status(500).json({
            message: 'Internal server error.'
        });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        await authSessionService.revokeSession(req.cookies?.[REFRESH_COOKIE_NAME]);     //thu hoi phien

        res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);      //xoa cookie
        res.status(200).json({
            message: 'Logged out successfully.'
        });
    } catch (error) {
        console.error('logout error:', error);

        res.status(500).json({
            message: 'Internal server error.'
        });
    }
};