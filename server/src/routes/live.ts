import { Router, Request, Response } from "express";
import prisma from "../config/database";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  startPolling,
  getSnapshot,
  getLivePointsForGrid,
  detectAndManageLiveSessions,
  liveEmitter,
  LiveRaceSnapshot,
} from "../services/liveRaceService";

const router = Router();

// All live routes require auth
router.use(authenticate);

// ─── GET /api/live/current ────────────────────────────────────────────────────
// Returns the currently live or most-recently-started race weekend (race or qualifying)
router.get("/current", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const WINDOW = 4 * 60 * 60 * 1000; // ± 4 hours

    const windowStart = new Date(now.getTime() - WINDOW);
    const windowEnd   = new Date(now.getTime() + 60 * 60 * 1000); // 1 h ahead

    // Prefer race in window, then qualifying in window
    const raceWeekend = await prisma.raceWeekend.findFirst({
      where: {
        OR: [
          { raceDate: { gte: windowStart, lte: windowEnd } },
          { qualifyingDate: { gte: windowStart, lte: windowEnd } },
        ],
      },
      orderBy: { raceDate: "asc" },
    });

    if (!raceWeekend) {
      return res.status(404).json({ message: "No live session found" });
    }

    // Determine which session key is active
    const raceInWindow =
      raceWeekend.raceDate &&
      raceWeekend.raceDate >= windowStart &&
      raceWeekend.raceDate <= windowEnd;

    const sessionKey = raceInWindow
      ? raceWeekend.externalId
      : raceWeekend.qualiSessionKey;

    return res.json({
      raceWeekend,
      activeSessionKey: sessionKey,
      sessionType: raceInWindow ? "Race" : "Qualifying",
    });
  } catch (err) {
    console.error("[Live] /current error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/live/:raceWeekendId ─────────────────────────────────────────────
// Returns the latest snapshot for a race weekend (non-streaming)
router.get("/:raceWeekendId", async (req: Request, res: Response) => {
  try {
    const { raceWeekendId } = req.params;
    const { gridId } = req.query as { gridId?: string };

    const raceWeekend = await prisma.raceWeekend.findUnique({
      where: { id: raceWeekendId },
    });
    if (!raceWeekend) {
      return res.status(404).json({ message: "Race weekend not found" });
    }

    // Determine active session key
    const now = new Date();
    const WINDOW = 4 * 60 * 60 * 1000;
    const raceInWindow =
      raceWeekend.raceDate &&
      Math.abs(now.getTime() - raceWeekend.raceDate.getTime()) < WINDOW;
    const sessionKey = raceInWindow
      ? raceWeekend.externalId
      : raceWeekend.qualiSessionKey;

    if (!sessionKey) {
      return res.status(404).json({ message: "No active session for this race weekend" });
    }

    // Ensure polling is running
    await startPolling(sessionKey);

    const snapshot = getSnapshot(sessionKey);
    if (!snapshot) {
      return res.status(503).json({ message: "Snapshot not yet available, retry shortly" });
    }

    let livePoints = null;
    if (gridId) {
      // Verify user is an active member of the grid
      const membership = await prisma.gridMembership.findUnique({
        where: { userId_gridId: { userId: req.user!.userId, gridId } },
      });
      if (!membership || membership.status !== "ACTIVE") {
        return res.status(403).json({ message: "Not a member of this grid" });
      }
      livePoints = await getLivePointsForGrid(snapshot, raceWeekendId, gridId);
    }

    return res.json({ snapshot, livePoints });
  } catch (err) {
    console.error("[Live] snapshot error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── GET /api/live/:raceWeekendId/stream?gridId=X ────────────────────────────
// Server-Sent Events stream: pushes LiveRaceSnapshot + UserLivePoints[] every poll cycle
router.get("/:raceWeekendId/stream", async (req: Request, res: Response) => {
  const { raceWeekendId } = req.params;
  const { gridId } = req.query as { gridId?: string };

  try {
    const raceWeekend = await prisma.raceWeekend.findUnique({
      where: { id: raceWeekendId },
    });
    if (!raceWeekend) {
      return res.status(404).json({ message: "Race weekend not found" });
    }

    // Verify grid membership if gridId provided
    if (gridId) {
      const membership = await prisma.gridMembership.findUnique({
        where: { userId_gridId: { userId: req.user!.userId, gridId } },
      });
      if (!membership || membership.status !== "ACTIVE") {
        return res.status(403).json({ message: "Not a member of this grid" });
      }
    }

    // Determine which session to stream
    const now = new Date();
    const WINDOW = 4 * 60 * 60 * 1000;
    const raceInWindow =
      raceWeekend.raceDate &&
      Math.abs(now.getTime() - raceWeekend.raceDate.getTime()) < WINDOW;
    const sessionKey = raceInWindow
      ? raceWeekend.externalId
      : raceWeekend.qualiSessionKey;

    if (!sessionKey) {
      return res.status(404).json({ message: "No active session for this race weekend" });
    }

    // Set SSE headers before any async work so the connection is established
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering for SSE
    res.flushHeaders();

    // Ensure polling is running for this session
    await startPolling(sessionKey);

    // Send the current snapshot immediately if available
    const initial = getSnapshot(sessionKey);
    if (initial) {
      const livePoints = gridId
        ? await getLivePointsForGrid(initial, raceWeekendId, gridId)
        : [];
      res.write(`data: ${JSON.stringify({ snapshot: initial, livePoints })}\n\n`);
    }

    // Subscribe to future updates
    const onUpdate = async (snap: LiveRaceSnapshot) => {
      try {
        const livePoints = gridId
          ? await getLivePointsForGrid(snap, raceWeekendId, gridId)
          : [];
        res.write(`data: ${JSON.stringify({ snapshot: snap, livePoints })}\n\n`);
      } catch (err) {
        console.error("[Live] SSE write error:", err);
      }
    };

    liveEmitter.on(`update:${sessionKey}`, onUpdate);

    // Keep-alive ping every 15 s to prevent proxy/browser timeouts
    const keepAlive = setInterval(() => {
      res.write(`:keepalive\n\n`);
    }, 15_000);

    // Clean up when client disconnects
    req.on("close", () => {
      clearInterval(keepAlive);
      liveEmitter.off(`update:${sessionKey}`, onUpdate);
    });

    // Keep the handler open (don't return/end the response)
  } catch (err) {
    console.error("[Live] /stream error:", err);
    // Can't send JSON if headers already sent, just end
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    } else {
      res.end();
    }
  }
});

// ─── POST /api/live/detect ────────────────────────────────────────────────────
// Manually trigger live session detection (admin only)
router.post("/detect", authorizeAdmin, async (_req: Request, res: Response) => {
  try {
    await detectAndManageLiveSessions();
    return res.json({ message: "Detection complete" });
  } catch (err) {
    console.error("[Live] detect error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
