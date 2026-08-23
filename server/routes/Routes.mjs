import express from "express";

// Import all modular routes
import authRoute from "./authRoute.mjs";
import dashboardRoute from "./dashboardRoute.mjs";
import gatewayRoute from "./gatewayRoute.mjs";
import orderRoute from "./orderRoute.mjs";
import roleRoute from "./roleRoute.mjs";
import ticketRoute from "./ticketRoute.mjs";
import userRoute from "./userRoute.mjs";
import walletRoute from "./walletRoute.mjs";

const router = express.Router();

// ==================================================
// HEALTH CHECK / TEST ROUTE
// ==================================================
router.get("/", (req, res) => {
  return res.status(200).json({ status: true, message: "Payment Gateway API Running 🚀" });
});

// ==================================================
// SYSTEM USER ROUTES (Admin, Staff, End Users)
// ==================================================
router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/roles", roleRoute);

// ==================================================
// DASHBOARD ROUTE (Unified)
// ==================================================
router.use("/dashboard", dashboardRoute);

// ==================================================
// TRANSACTION & WALLET ROUTES
// ==================================================
router.use("/wallet", walletRoute);

// ==================================================
// PAYMENT ORDER ROUTES (API Consumer endpoints)
// ==================================================
router.use("/orders", orderRoute);

// ==================================================
// GATEWAY RESELLER API ROUTES
// ==================================================
router.use("/v1/gateway", gatewayRoute);

// ==================================================
// SUPPORT TICKETS
// ==================================================
router.use("/v1/tickets", ticketRoute);

export default router;
