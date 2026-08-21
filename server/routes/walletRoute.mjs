import express from "express";
import { processPayment, requestWithdrawal } from "../controllers/walletController.mjs";
import { verifyAuth } from "../middlewares/roleAuth.mjs";

const router = express.Router();

router.post("/payment", verifyAuth, processPayment);
router.post("/withdraw", verifyAuth, requestWithdrawal);

export default router;
