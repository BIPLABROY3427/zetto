import express from 'express';
import { register, login, refreshToken, logout, verifySignupOtp, forgotPassword, resetPassword, resendSignupOtp, getActivityLogs, changePassword } from '../controllers/authController.mjs';
import { verifyAuth } from '../middlewares/roleAuth.mjs';

const router = express.Router();

router.post('/register', register);
router.post('/resend-signup-otp', resendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', verifyAuth, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', verifyAuth, changePassword); // <-- Added change password route
router.get('/activity-log', verifyAuth, getActivityLogs);

export default router;
