import express from 'express';
import { signup, login, getMe } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { loginLimiter } from '../middlewares/rateLimitMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login',loginLimiter, login);
router.get('/me', protect, getMe);
export default router;