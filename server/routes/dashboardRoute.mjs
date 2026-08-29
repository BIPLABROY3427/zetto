import express from "express";
import {
  getAdminAnalytics,
  getAllSystemTransactions,
  getDashboardStats,
  getTransactions,
  resendWebhook,
  syncTransactionStatus,
  getKLineData,
  cancelPayoutQueue,
} from '../controllers/dashboardController.mjs';
import {
  resetApiKey,
  resetWebhookSecret,
  updateWebhooks,
} from '../controllers/settingsController.mjs';
import { requireRole, verifyAuth } from "../middlewares/roleAuth.mjs";

const router = express.Router();

router.get("/stats", verifyAuth, getDashboardStats);
router.get("/kline", verifyAuth, getKLineData);
router.get("/transactions", verifyAuth, getTransactions);
router.post("/transactions/:id/resend-webhook", verifyAuth, resendWebhook);
router.get("/admin/transactions", verifyAuth, requireRole('superadmin', 'admin'), getAllSystemTransactions);
router.post("/admin/transactions/:id/sync", verifyAuth, requireRole('superadmin', 'admin'), syncTransactionStatus);
router.post(
  '/admin/transactions/:id/cancel-payout',
  verifyAuth,
  requireRole('superadmin', 'admin'),
  cancelPayoutQueue
);
router.get("/admin/analytics", verifyAuth, requireRole('superadmin', 'admin'), getAdminAnalytics);
router.put("/settings/webhooks", verifyAuth, updateWebhooks);
router.post("/settings/apikey/reset", verifyAuth, resetApiKey);
router.post('/settings/webhook-secret/reset', verifyAuth, resetWebhookSecret);

export default router;
