import express from 'express';
import { signup, login, getMe, refresh, logout } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { loginLimiter, refreshLimiter } from '../middlewares/rateLimitMiddleware';
import { requireTrustedOrigin } from '../middlewares/authOriginMiddleware';
import { updateMe } from '../controllers/userController';

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
router.patch('/me', protect, updateMe);

export default router;