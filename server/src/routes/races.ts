import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import * as raceService from "../services/raceService";

const router = Router();

router.use(authenticate);

router.get("/weekends", async (req: Request, res: Response) => {
  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  const weekends = await raceService.getRaceWeekends(season);
  res.json(weekends);
});

router.get("/weekends/:id", async (req: Request, res: Response) => {
  const weekend = await raceService.getRaceWeekendById(req.params.id);
  if (!weekend) {
    res.status(404).json({ error: "Race weekend not found" });
    return;
  }
  res.json(weekend);
});

router.get("/drivers", async (req: Request, res: Response) => {
  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  const drivers = await raceService.getDrivers(season);
  res.json(drivers);
});

router.get("/teams", async (req: Request, res: Response) => {
  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  const teams = await raceService.getTeams(season);
  res.json(teams);
});

export default router;
