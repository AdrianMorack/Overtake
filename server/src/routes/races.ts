import { Router, Request, Response } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import * as raceService from "../services/raceService";
import { syncSeasonData, syncRaceResults } from "../jobs/syncF1Data";

const router = Router();

// Admin: manually trigger a season data sync
router.post("/admin/sync", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
  if (isNaN(year) || year < 2020 || year > 2030) {
    res.status(400).json({ error: "Invalid year parameter (must be 2020-2030)" });
    return;
  }
  try {
    await syncSeasonData(year);
    await syncRaceResults();
    res.json({ message: `Sync complete for ${year}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.use(authenticate);

router.get("/weekends", async (req: Request, res: Response) => {
  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  if (season !== undefined && (isNaN(season) || season < 2020 || season > 2030)) {
    res.status(400).json({ error: "Invalid season parameter" });
    return;
  }
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
  if (season !== undefined && (isNaN(season) || season < 2020 || season > 2030)) {
    res.status(400).json({ error: "Invalid season parameter" });
    return;
  }
  const drivers = await raceService.getDrivers(season);
  res.json(drivers);
});

router.get("/teams", async (req: Request, res: Response) => {
  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  if (season !== undefined && (isNaN(season) || season < 2020 || season > 2030)) {
    res.status(400).json({ error: "Invalid season parameter" });
    return;
  }
  const teams = await raceService.getTeams(season);
  res.json(teams);
});

export default router;
