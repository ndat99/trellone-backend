import 'dotenv/config';
import type { CookieOptions } from 'express';

export const AUTH_ALLOWED_ORIGINS = [
    new URL(process.env.FRONTEND_ORIGIN || 'http://localhost:5173').origin,
    new URL(process.env.API_ORIGIN || 'http://localhost:3636').origin
];

export const REFRESH_COOKIE_NAME = 'trellone_refresh';  //ten refresh token

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth'
};