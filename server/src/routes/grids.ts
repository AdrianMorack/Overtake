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

const updateGridSchema = z.object({
  name: z.string().min(2).max(50),
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

router.get("/:gridId", async (req: Request, res: Response) => {
  try {
    const grid = await gridService.getGrid(req.params.gridId);
    res.json(grid);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.get("/:gridId/leaderboard", async (req: Request, res: Response) => {
  const leaderboard = await gridService.getGridLeaderboard(req.params.gridId);
  res.json(leaderboard);
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
