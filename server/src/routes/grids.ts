import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as gridService from "../services/gridService";

const router = Router();

const createGridSchema = z.object({
  name: z.string().min(2).max(50),
  season: z.number().int().min(2020).max(2030).optional(),
});

const joinGridSchema = z.object({
  code: z.string().length(6),
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

router.post("/join", validate(joinGridSchema), async (req: Request, res: Response) => {
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

router.get("/:gridId/leaderboard", async (req: Request, res: Response) => {
  const leaderboard = await gridService.getGridLeaderboard(req.params.gridId);
  res.json(leaderboard);
});

export default router;
