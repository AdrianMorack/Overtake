import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as predictionService from "../services/predictionService";

const router = Router();

const submitSchema = z.object({
  raceWeekendId: z.string(),
  gridId: z.string(),
  qualiFirst: z.string(),
  qualiSecond: z.string(),
  qualiThird: z.string(),
  raceFirst: z.string(),
  raceSecond: z.string(),
  raceThird: z.string(),
  fastestLap: z.string(),
  topTeam: z.string(),
});

router.use(authenticate);

router.post("/", validate(submitSchema), async (req: Request, res: Response) => {
  try {
    const { raceWeekendId, gridId, ...input } = req.body;
    const prediction = await predictionService.submitPrediction(
      req.user!.userId,
      raceWeekendId,
      gridId,
      input
    );
    res.status(201).json(prediction);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/grid/:gridId", async (req: Request, res: Response) => {
  const predictions = await predictionService.getUserPredictions(
    req.user!.userId,
    req.params.gridId
  );
  res.json(predictions);
});

router.get("/race/:raceWeekendId/grid/:gridId", async (req: Request, res: Response) => {
  // Ensure the requesting user is a member of this grid
  const isMember = await predictionService.isGridMember(req.user!.userId, req.params.gridId);
  if (!isMember) {
    res.status(403).json({ error: "You are not a member of this grid" });
    return;
  }
  const predictions = await predictionService.getRacePredictions(
    req.params.raceWeekendId,
    req.params.gridId
  );
  res.json(predictions);
});

export default router;
