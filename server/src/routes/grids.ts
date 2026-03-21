import { Router, Request, Response } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as gridService from "../services/gridService";

const router = Router();

const createGridSchema = z.object({
  name: z.string().min(2).max(50),
  season: z.number().int().min(2020).max(2030).optional(),
});

const updateGridSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  showPicksBeforeLock: z.boolean().optional(),
});

const joinGridSchema = z.object({
  code: z.string().length(6),
});

// Strict rate limit on join to prevent brute-forcing invite codes
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many join attempts, please try again later." },
});

// All grid routes require authentication
router.use(authenticate);

router.post("/", validate(createGridSchema), async (req: Request, res: Response) => {
  try {
    const grid = await gridService.createGrid(req.body.name, req.user!.userId, req.body.season);
    res.status(201).json(grid);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/join", joinLimiter, validate(joinGridSchema), async (req: Request, res: Response) => {
  try {
    const grid = await gridService.joinGrid(req.body.code, req.user!.userId);
    res.json(grid);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req: Request, res: Response) => {
  const grids = await gridService.getUserGrids(req.user!.userId);
  res.json(grids);
});

router.get("/:gridId", async (req: Request, res: Response) => {
  try {
    // Verify user is a member of this grid
    const membership = await gridService.getMembership(req.user!.userId, req.params.gridId);
    if (!membership) {
      res.status(403).json({ error: "Not a member of this grid" });
      return;
    }
    const grid = await gridService.getGrid(req.params.gridId);
    res.json(grid);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.get("/:gridId/leaderboard", async (req: Request, res: Response) => {
  try {
    // Verify user is a member of this grid
    const membership = await gridService.getMembership(req.user!.userId, req.params.gridId);
    if (!membership) {
      res.status(403).json({ error: "Not a member of this grid" });
      return;
    }
    const leaderboard = await gridService.getGridLeaderboard(req.params.gridId);
    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

router.patch("/:gridId", validate(updateGridSchema), async (req: Request, res: Response) => {
  try {
    const grid = await gridService.updateGrid(req.params.gridId, req.body, req.user!.userId);
    res.json(grid);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:gridId", async (req: Request, res: Response) => {
  try {
    await gridService.deleteGrid(req.params.gridId, req.user!.userId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:gridId/members/:userId/approve", async (req: Request, res: Response) => {
  try {
    await gridService.approveMember(req.params.gridId, req.params.userId, req.user!.userId);
    res.json({ message: "Member approved" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:gridId/members/:userId", async (req: Request, res: Response) => {
  try {
    await gridService.removeMember(req.params.gridId, req.params.userId, req.user!.userId);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
