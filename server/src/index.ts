import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import gridRoutes from "./routes/grids";
import predictionRoutes from "./routes/predictions";
import raceRoutes from "./routes/races";
import { startSyncJobs, syncSeasonData } from "./jobs/syncF1Data";

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/grids", gridRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/races", raceRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Error handling ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`🏁 Overtake server running on port ${env.port} [${env.nodeEnv}]`);

  // Start background sync jobs
  startSyncJobs();

  // Initial season data sync on startup (non-blocking)
  syncSeasonData().catch((err) => console.error("[Startup] Season sync failed:", err));
});

export default app;
