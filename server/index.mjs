import cluster from 'cluster';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import http from 'http';
import moment from 'moment-timezone';
import os from 'os';

import Config, { closeConnections } from './config/config.mjs';
import apiRoutes from './routes/Routes.mjs';

const PORT = process.env.PORT || 5000;

// ================= TIMEZONE =================
moment.tz.setDefault('Asia/Kolkata');
process.env.TZ = 'Asia/Kolkata';

// ================= INIT DB =================
await Config();

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  // const numCPUs = 2;
  let isShuttingDown = false;

  console.log(`🚀 Primary process ${process.pid} is running`);
  console.log(
    `🔥 Starting cluster with ${numCPUs} workers for maximum performance and auto-restart...`
  );

  // Start Cron Jobs ONLY on the primary process to prevent duplicate runs
  await import('./services/payoutCron.mjs');
  await import('./services/payinReconciliationCron.mjs');

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Auto-restart on crash (unless shutting down)
  cluster.on('exit', async (worker, code, signal) => {
    if (isShuttingDown) {
      console.log(`Worker ${worker.process.pid} exited cleanly during shutdown.`);
      const activeWorkers = Object.keys(cluster.workers).length;
      if (activeWorkers === 0) {
        console.log('🛑 All workers shut down cleanly. Primary closing connections and exiting.');
        try {
          await closeConnections();
        } catch (e) {
          console.error('Error closing primary connections:', e.message);
        }
        process.exit(0);
      }
      return;
    }

    console.log(`❌ Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    console.log('🔄 Starting a new worker...');
    cluster.fork();
  });

  // Coordinated graceful shutdown for primary
  const handlePrimaryShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`🛑 Primary Server shutting down on ${signal}. Signaling all workers...`);

    for (const id in cluster.workers) {
      cluster.workers[id].send({ type: 'shutdown' });
      cluster.workers[id].kill('SIGTERM');
    }

    // Force exit after 10s if any worker hangs
    setTimeout(async () => {
      console.warn('⚠️ Force exiting primary after timeout.');
      try {
        await closeConnections();
      } catch (e) {}
      process.exit(0);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handlePrimaryShutdown('SIGTERM'));
  process.on('SIGINT', () => handlePrimaryShutdown('SIGINT'));
} else {
  // ================= WORKER PROCESS =================
  const app = express();
  const server = http.createServer(app);
  let isWorkerShuttingDown = false;

  // Initialize webhook queue worker in each cluster worker
  const { webhookWorker } = await import('./services/webhookQueue.mjs');

  // ================= TRUST PROXY =================
  app.set('trust proxy', 1); // ✅ safer for production (behind proxy)

  // ================= SECURITY =================
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(compression());

  // ================= CORS =================
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : true, // Fall back to echo-origin if CORS_ORIGIN not set (dev mode)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-webhook-signature'],
    })
  );

  // ================= RATE LIMIT =================
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 1000000, // Extremely high limit for API users
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req),
    handler: (req, res) => {
      return res
        .status(429)
        .json({ status: false, message: 'Too many requests, please try again later.' });
    },
  });

  app.use('/api', limiter); // ✅ apply only on API (not root)

  // ================= BODY PARSER =================
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: true, limit: '200kb' }));

  // ================= SANITIZATION =================
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      req.body = mongoSanitize.sanitize(req.body);
    }
    next();
  });

  // ================= HEALTH CHECK =================
  app.get('/', (req, res) => {
    return res
      .status(200)
      .json({ status: true, message: `Payment Gateway API Running 🚀 on Worker ${process.pid}` });
  });

  // ================= STATIC FILES =================
  app.use('/uploads', express.static('uploads'));

  // ================= ROUTES =================
  app.use('/api', apiRoutes);

  // ================= 404 HANDLER =================
  app.use((req, res) => {
    return res.status(404).json({ status: false, message: 'Route not found' });
  });

  // ================= GLOBAL ERROR HANDLER =================
  app.use((err, req, res, next) => {
    console.error(`❌ ERROR on Worker ${process.pid}:`, err);

    // JSON parse error
    if (err instanceof SyntaxError && err.status === 400) {
      return res.status(400).json({ status: false, message: 'Invalid JSON payload' });
    }

    return res
      .status(err.status || 500)
      .json({ status: false, message: err.message || 'Internal Server Error' });
  });

  // ================= SERVER START =================
  server.listen(PORT, () => {
    console.log(`✅ Worker ${process.pid} is running on port ${PORT}`);
  });

  // ================= GRACEFUL SHUTDOWN FOR WORKER =================
  const gracefulShutdown = async (signal) => {
    if (isWorkerShuttingDown) return;
    isWorkerShuttingDown = true;
    console.log(`🛑 Worker ${process.pid} shutting down on ${signal}...`);

    server.close(async () => {
      console.log(`✅ Worker ${process.pid} HTTP server closed. Draining resources...`);
      try {
        if (webhookWorker) {
          await webhookWorker.close();
          console.log(`✅ Worker ${process.pid} webhook worker closed.`);
        }
        await closeConnections();
      } catch (err) {
        console.error(`Worker ${process.pid} resource close error:`, err.message);
      }
      console.log(`✅ Worker ${process.pid} shutdown finished.`);
      process.exit(0);
    });

    // Safety timeout: If active HTTP requests take > 8s, force exit
    setTimeout(() => {
      console.warn(`⚠️ Worker ${process.pid} force closed after timeout.`);
      process.exit(0);
    }, 8000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('message', (msg) => {
    if (msg && msg.type === 'shutdown') {
      gracefulShutdown('IPC');
    }
  });
}
