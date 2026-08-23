import express from "express";
import { getAdminAnalytics, getAllSystemTransactions, getDashboardStats, getTransactions, resendWebhook, syncTransactionStatus, getKLineData } from "../controllers/dashboardController.mjs";
import { resetApiKey, updateWebhooks } from "../controllers/settingsController.mjs";
import { requireRole, verifyAuth } from "../middlewares/roleAuth.mjs";

const router = express.Router();

router.get("/stats", verifyAuth, getDashboardStats);
router.get("/kline", verifyAuth, getKLineData);
router.get("/transactions", verifyAuth, getTransactions);
router.post("/transactions/:id/resend-webhook", verifyAuth, resendWebhook);
router.get("/admin/transactions", verifyAuth, requireRole('superadmin', 'admin'), getAllSystemTransactions);
router.post("/admin/transactions/:id/sync", verifyAuth, requireRole('superadmin', 'admin'), syncTransactionStatus);
router.get("/admin/analytics", verifyAuth, requireRole('superadmin', 'admin'), getAdminAnalytics);
router.put("/settings/webhooks", verifyAuth, updateWebhooks);
router.post("/settings/apikey/reset", verifyAuth, resetApiKey);

export default router;
