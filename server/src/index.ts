import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import gridRoutes from "./routes/grids";
import predictionRoutes from "./routes/predictions";
import raceRoutes from "./routes/races";
import liveRoutes from "./routes/live";
import { startSyncJobs } from "./jobs/syncF1Data";

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({ origin: env.corsOrigin, credentials: true }));

// ─── Body parsing (10 kb cap to limit payload DoS) ──────────────────────────
app.use(express.json({ limit: "10kb" }));

// ─── Global rate limit: 200 req / 15 min per IP ─────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  })
);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/grids", gridRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/races", raceRoutes);
app.use("/api/live", liveRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Error handling ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`🏁 Overtake server running on port ${env.port} [${env.nodeEnv}]`);

  // Start background sync jobs (results check, live detection)
  startSyncJobs();
});

export default app;
