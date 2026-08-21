import compression from "compression";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import http from "http";
import moment from "moment-timezone";

import Config from "./config/config.mjs";
import "./services/webhookQueue.mjs";

const PORT = process.env.PORT || 5872;

// ================= TIMEZONE =================
moment.tz.setDefault("Asia/Kolkata");
process.env.TZ = "Asia/Kolkata";

// ================= INIT =================
await Config();

const app = express();
const server = http.createServer(app);

// ================= TRUST PROXY =================
app.set("trust proxy", 1); // ✅ safer for production (behind proxy)

// ================= SECURITY =================
app.use(helmet());
app.use(compression());

// ================= CORS =================
app.use(
  cors({
    origin: true, // Echo the origin back to support withCredentials
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "x-webhook-signature",
    ],
  })
);

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 1000000, // Extremely high limit for API users
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (req, res) => { return res.status(429).json({ status: false, message: "Too many requests, please try again later.", }); },
});

app.use("/api", limiter); // ✅ apply only on API (not root)

// ================= BODY PARSER =================
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

// ================= SANITIZATION =================
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }
  next();
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => { return res.status(200).json({ status: true, message: "Payment Gateway API Running 🚀", }); });

// ================= ROUTES =================
import apiRoutes from "./routes/Routes.mjs";
app.use("/api", apiRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => { return res.status(404).json({ status: false, message: "Route not found", }); });

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err);

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ status: false, message: "Invalid JSON payload", });
  }

  return res.status(err.status || 500).json({ status: false, message: err.message || "Internal Server Error", });
});

// ================= SERVER START =================
server.listen(PORT, () => {
  // console.log(`🚀 Server running on port ${PORT}`);
});

// ================= GRACEFUL SHUTDOWN =================
const gracefulShutdown = () => {
  console.log("🛑 Server shutting down...");

  server.close(() => {
    console.log("✅ All connections closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
// Trigger nodemon restart
