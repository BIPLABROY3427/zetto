import express from 'express';
import { register, login, refreshToken, logout, verifySignupOtp, forgotPassword, resetPassword } from '../controllers/authController.mjs';

const router = express.Router();

router.post('/register', register);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
