import express from "express";
import { createOrder } from "../controllers/orderController.mjs";
import { simulatePaymentCompletion } from "../controllers/webhookTestController.mjs";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.mjs";

const router = express.Router();

router.post("/create", apiKeyAuth, createOrder);
router.post("/simulate-payment", simulatePaymentCompletion);

export default router;
