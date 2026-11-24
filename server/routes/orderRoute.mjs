import express from "express";
import { createOrder } from "../controllers/orderController.mjs";
import { simulatePaymentCompletion } from "../controllers/webhookTestController.mjs";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.mjs";

const router = express.Router();

router.post("/create", apiKeyAuth, createOrder);

// ─── SECURITY: simulate-payment is a test-only endpoint ──────────────────────
// Double-guarded: route level + controller level.
// In production this route is completely blocked at the route layer itself.
if (process.env.NODE_ENV !== 'production') {
  router.post("/simulate-payment", simulatePaymentCompletion);
}

export default router;
