import express from 'express';
import {
    createPaymentIntent,
    aeroPayInCallback,
    createPayoutIntent,
    aeroPayOutCallback,
    queryPayinOrder,
    queryPayoutOrder,
    getMerchantBalance,
    checkUtr,
    checkUpi,
    getSystemHealth
} from '../controllers/gatewayController.mjs';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.mjs';
import { apiOrJwtAuth } from '../middlewares/apiOrJwtAuth.mjs';
import { verifyAuth, requireRole } from '../middlewares/roleAuth.mjs';

const router = express.Router();

// --- API Endpoints for Merchants (Requires API Key or JWT) ---
router.post('/payment', apiOrJwtAuth, createPaymentIntent);
router.post('/payout', apiOrJwtAuth, createPayoutIntent);
router.get('/payin/query', apiOrJwtAuth, queryPayinOrder);
router.get('/payout/query', apiOrJwtAuth, queryPayoutOrder);
router.get('/balance', apiOrJwtAuth, getMerchantBalance);
router.post('/utrcheck', apiOrJwtAuth, checkUtr);
router.post('/upicheck', apiOrJwtAuth, checkUpi);

// --- Webhooks from AeroPay (Public, validated via MD5 signature) ---
router.post('/aeropay/callback', aeroPayInCallback);
router.post('/aeropay/payoutcallback', aeroPayOutCallback);

// --- Superadmin System Health ---
router.get('/system/health', verifyAuth, requireRole('superadmin'), getSystemHealth);

export default router;
