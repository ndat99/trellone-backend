import express from 'express';
import { signup, login, getMe, refresh, logout } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { loginLimiter, refreshLimiter } from '../middlewares/rateLimitMiddleware';
import { requireTrustedOrigin } from '../middlewares/authOriginMiddleware';

const router = express.Router();

router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

router.post('/signup', signup);
router.post('/login', requireTrustedOrigin, loginLimiter, login);
router.post('/refresh', requireTrustedOrigin, refreshLimiter, refresh);
router.post('/logout', requireTrustedOrigin, logout);
router.get('/me', protect, getMe);
export default router;