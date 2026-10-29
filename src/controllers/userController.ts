import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware';
import userService from '../services/userService';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from '../config/auth';


function sendError(res: Response, error: unknown): void {
    const candidate = error as { status?: number; message?: string } | null;
    const status = candidate &&
        [400, 404, 409].includes(candidate.status ?? 0)
        ? candidate.status!
        : 500;

    if (status === 500) {
        console.error('Account request failed:', error);
    }

    res.status(status).json({
        message: status === 500
            ? 'Internal server error.'
            : candidate?.message ?? 'Request failed.'
    });
}

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await userService.updateProfile(req.user!.id, req.body);
        res.status(200).json({ message: 'Profile updated successfully.', user });
    } catch (error) {
        sendError(res, error);
    }
};


export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await userService.changePassword(req.user!.id, req.body);
        res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
        res.status(200).json({
            message: 'Password changed. Please log in again.'
        });
    } catch (error) {
        sendError(res, error);
    }
};