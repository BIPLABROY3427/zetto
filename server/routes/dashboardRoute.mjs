import express from "express";
import { getDashboardStats, getTransactions, resendWebhook, getAllSystemTransactions, getAdminAnalytics } from "../controllers/dashboardController.mjs";
import { updateWebhooks, resetApiKey } from "../controllers/settingsController.mjs";
import { verifyAuth } from "../middlewares/roleAuth.mjs";

const router = express.Router();

router.get("/stats", verifyAuth, getDashboardStats);
router.get("/transactions", verifyAuth, getTransactions);
router.post("/transactions/:id/resend-webhook", verifyAuth, resendWebhook);
router.get("/admin/transactions", verifyAuth, getAllSystemTransactions);
router.get("/admin/analytics", verifyAuth, getAdminAnalytics);
router.put("/settings/webhooks", verifyAuth, updateWebhooks);
router.post("/settings/apikey/reset", verifyAuth, resetApiKey);

export default router;
