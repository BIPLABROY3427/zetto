import express from 'express';
import { register, login, refreshToken, logout, verifySignupOtp, forgotPassword, resetPassword, resendSignupOtp, getActivityLogs, changePassword } from '../controllers/authController.mjs';
import { verifyAuth } from '../middlewares/roleAuth.mjs';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter.mjs';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/resend-signup-otp', otpLimiter, resendSignupOtp);
router.post('/verify-signup-otp', otpLimiter, verifySignupOtp);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', verifyAuth, logout);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);
router.put('/change-password', verifyAuth, changePassword);
router.get('/activity-log', verifyAuth, getActivityLogs);

export default router;
