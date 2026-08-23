import express from 'express';
import {
    aeroPayInCallback,
    aeroPayOutCallback,
    bindPayinOrder,
    checkUpi,
    checkUtr,
    createPaymentIntent,
    createPayoutIntent,
    getMerchantBalance,
    getSystemHealth,
    queryBatchPayinOrders,
    queryPayinOrder,
    queryPayoutOrder
} from '../controllers/gatewayController.mjs';
import { apiOrJwtAuth } from '../middlewares/apiOrJwtAuth.mjs';
import { requireRole, verifyAuth } from '../middlewares/roleAuth.mjs';

const router = express.Router();

// --- API Endpoints for Merchants (Requires API Key or JWT) ---
router.post('/payment', apiOrJwtAuth, createPaymentIntent);
router.post('/payout', apiOrJwtAuth, createPayoutIntent);
router.get('/payin/query', apiOrJwtAuth, queryPayinOrder);
router.get('/payout/query', apiOrJwtAuth, queryPayoutOrder);
router.post('/payin/bind', apiOrJwtAuth, bindPayinOrder);
router.post('/payin/querybatch', apiOrJwtAuth, queryBatchPayinOrders);
router.get('/balance', apiOrJwtAuth, getMerchantBalance);
router.post('/utrcheck', apiOrJwtAuth, checkUtr);
router.post('/upicheck', apiOrJwtAuth, checkUpi);

// --- Webhooks from AeroPay (Public, validated via MD5 signature) ---
router.post('/aeropay/callback', aeroPayInCallback);
router.post('/aeropay/payoutcallback', aeroPayOutCallback);

// --- Superadmin / Admin System Health ---
router.get('/system/health', verifyAuth, requireRole('superadmin', 'admin'), getSystemHealth);

export default router;
