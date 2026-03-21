import { CronJob } from "cron";
import { RaceStatus } from "@prisma/client";
import prisma from "../config/database";
import * as FastF1 from "../services/fastF1Client";
import { scoreRace } from "../services/scoringService";
import { detectAndManageLiveSessions } from "../services/liveRaceService";

/**
 * Sync race schedule, drivers, teams from FastF1 for a given season.
 * Intended to run once at the start of each season and periodically to pick up changes.
 */
export async function syncSeasonData(year: number = new Date().getFullYear()) {
  console.log(`[Sync] Starting season data sync for ${year}…`);

  // 1. Fetch sessions
  const { races, qualis } = await FastF1.getRaceAndQualiSessions(year);
  console.log(`[Sync] Found ${races.length} races, ${qualis.length} qualifyings`);

  // Build maps from meeting_key → qualifying date and qualifying session_key
  const qualiDateByMeeting = new Map<number, string>();
  const qualiKeyByMeeting  = new Map<number, number>();
  for (const q of qualis) {
    qualiDateByMeeting.set(q.meeting_key, q.date_start);
    qualiKeyByMeeting.set(q.meeting_key, q.session_key);
  }

  // 2. Upsert race weekends
  for (let i = 0; i < races.length; i++) {
    const race = races[i];
    const raceDate = new Date(race.date_start);
    const qualiDate = qualiDateByMeeting.get(race.meeting_key);
    // Lock predictions 1 hour before qualifying (or 3 hours before race if no quali found)
    const lockDate = qualiDate
      ? new Date(new Date(qualiDate).getTime() - 60 * 60 * 1000)
      : new Date(raceDate.getTime() - 3 * 60 * 60 * 1000);

    const qualiSessionKey = qualiKeyByMeeting.get(race.meeting_key) ?? null;

    await prisma.raceWeekend.upsert({
      where: { externalId: race.session_key },
      create: {
        externalId: race.session_key,
        qualiSessionKey,
        season: year,
        round: i + 1,
        raceName: `${race.country_name} Grand Prix`,
        circuitName: race.circuit_short_name,
        country: race.country_name,
        raceDate,
        qualifyingDate: qualiDate ? new Date(qualiDate) : null,
        predictionsLock: lockDate,
      },
      update: {
        qualiSessionKey,
        raceName: `${race.country_name} Grand Prix`,
        circuitName: race.circuit_short_name,
        raceDate,
        qualifyingDate: qualiDate ? new Date(qualiDate) : null,
        predictionsLock: lockDate,
      },
    });
  }

  // 3. Sync drivers + teams from the first race session
  // FastF1 session loads can hit upstream rate limits — skip if unavailable,
  // the schedule sync above is more important and already completed.
  if (races.length > 0) {
    let drivers: Awaited<ReturnType<typeof FastF1.getSessionDrivers>>;
    try {
      drivers = await FastF1.getSessionDrivers(races[0].session_key);
    } catch (err) {
      console.warn(`[Sync] Could not load drivers from FastF1 (will skip driver/team sync): ${err}`);
      console.log(`[Sync] Season data sync complete (schedule only — driver sync skipped)`);
      return;
    }
    const teamMap = new Map<string, { name: string; color: string }>();

    for (const d of drivers) {
      teamMap.set(d.team_name, { name: d.team_name, color: d.team_colour });
    }

    // Upsert teams
    for (const [, team] of teamMap) {
      await prisma.team.upsert({
        where: { name: team.name },
        create: { name: team.name, color: team.color ? `#${team.color}` : null, season: year },
        update: { color: team.color ? `#${team.color}` : null },
      });
    }

    // Upsert drivers
    for (const d of drivers) {
      const team = await prisma.team.findFirst({ where: { name: d.team_name } });
      await prisma.driver.upsert({
        where: { externalId: d.driver_number },
        create: {
          externalId: d.driver_number,
          firstName: d.first_name,
          lastName: d.last_name,
          code: d.name_acronym,
          teamId: team?.id,
          headshotUrl: d.headshot_url,
          season: year,
        },
        update: {
          firstName: d.first_name,
          lastName: d.last_name,
          code: d.name_acronym,
          teamId: team?.id,
          headshotUrl: d.headshot_url,
        },
      });
    }

    console.log(`[Sync] Synced ${drivers.length} drivers, ${teamMap.size} teams`);
  }

  console.log(`[Sync] Season data sync complete`);
}

/**
 * Fetch qualifying results once qualifying is done and score quali predictions.
 * Runs frequently during qualifying windows.
 */
export async function syncQualiResults() {
  console.log(`[Quali] Checking for qualifying results…`);

  const pending = await prisma.raceWeekend.findMany({
    where: {
      status: "UPCOMING",
      qualifyingDate: { lt: new Date() },
      qualiSessionKey: { not: null },
    },
  });

  for (const race of pending) {
    if (!race.qualiSessionKey) continue;

    try {
      const qualiPositions = await FastF1.getFinalPositions(race.qualiSessionKey);
      if (qualiPositions.length < 3) {
        console.log(`[Quali] ${race.raceName}: insufficient qualifying data yet`);
        continue;
      }

      // Need drivers for code lookup — use the quali session
      let drivers;
      try {
        drivers = await FastF1.getSessionDrivers(race.qualiSessionKey);
      } catch {
        // Fallback: try race session
        if (race.externalId) drivers = await FastF1.getSessionDrivers(race.externalId);
        else continue;
      }
      const driverByNum = new Map(drivers.map((d) => [d.driver_number, d]));
      const codeFor = (num: number) => driverByNum.get(num)?.name_acronym ?? "UNK";

      const qualiData = {
        qualiFirst: codeFor(qualiPositions[0].driver_number),
        qualiSecond: codeFor(qualiPositions[1].driver_number),
        qualiThird: codeFor(qualiPositions[2].driver_number),
      };

      // Store partial result (quali only)
      await prisma.raceResult.upsert({
        where: { raceWeekendId: race.id },
        create: {
          raceWeekendId: race.id,
          ...qualiData,
          raceFirst: null,
          raceSecond: null,
          raceThird: null,
          fastestLap: null,
          topTeam: null,
        },
        update: qualiData,
      });

      // Score predictions (partial — only quali points will be counted)
      await scoreRace(race.id);

      // Mark as QUALI_COMPLETE
      await prisma.raceWeekend.update({
        where: { id: race.id },
        data: { status: RaceStatus.QUALI_COMPLETE },
      });

      console.log(`[Quali] ✓ Scored qualifying for ${race.raceName}`);
    } catch (err) {
      console.error(`[Quali] Error processing ${race.raceName}:`, err);
    }
  }
}

/**
 * Fetch official race results for completed races and score predictions.
 * Runs regularly (e.g. every 5 min on race days).
 */
export async function syncRaceResults() {
  console.log(`[Results] Checking for new race results…`);

  // Find race weekends past their race date that haven't been completed yet
  const pending = await prisma.raceWeekend.findMany({
    where: {
      status: { in: [RaceStatus.UPCOMING, RaceStatus.QUALI_COMPLETE, RaceStatus.IN_PROGRESS] },
      raceDate: { lt: new Date() },
      externalId: { not: null },
    },
  });

  for (const race of pending) {
    if (!race.externalId) continue;

    try {
      // Get race final positions
      const racePositions = await FastF1.getFinalPositions(race.externalId);
      if (racePositions.length < 3) {
        console.log(`[Results] Race ${race.raceName}: insufficient position data yet`);
        continue;
      }

      // Get qualifying final positions using the stored qualiSessionKey
      let qualiPositions: Awaited<ReturnType<typeof FastF1.getFinalPositions>> = [];
      if (race.qualiSessionKey) {
        try {
          qualiPositions = await FastF1.getFinalPositions(race.qualiSessionKey);
        } catch {
          // Quali data may not be available yet
        }
      }

      // Get fastest lap
      const fastestLapDriverNum = await FastF1.getFastestLapDriver(race.externalId);

      // Resolve driver numbers → codes
      const drivers = await FastF1.getSessionDrivers(race.externalId);
      const driverByNum = new Map(drivers.map((d) => [d.driver_number, d]));

      const codeFor = (num: number) => driverByNum.get(num)?.name_acronym ?? "UNK";
      const teamFor = (num: number) => driverByNum.get(num)?.team_name ?? "Unknown";

      // Determine top team (team of P1 + P2 combined, simplified as team of winner)
      const topTeam = teamFor(racePositions[0].driver_number);

      const resultData = {
        qualiFirst:  qualiPositions[0] ? codeFor(qualiPositions[0].driver_number) : codeFor(racePositions[0].driver_number),
        qualiSecond: qualiPositions[1] ? codeFor(qualiPositions[1].driver_number) : codeFor(racePositions[1].driver_number),
        qualiThird:  qualiPositions[2] ? codeFor(qualiPositions[2].driver_number) : codeFor(racePositions[2].driver_number),
        raceFirst:   codeFor(racePositions[0].driver_number),
        raceSecond:  codeFor(racePositions[1].driver_number),
        raceThird:   codeFor(racePositions[2].driver_number),
        fastestLap:  fastestLapDriverNum ? codeFor(fastestLapDriverNum) : "UNK",
        topTeam,
      };

      // Store or update result
      await prisma.raceResult.upsert({
        where: { raceWeekendId: race.id },
        create: { raceWeekendId: race.id, ...resultData },
        update: resultData,
      });

      // Score all predictions (now with full results)
      await scoreRace(race.id);

      // Mark race as completed
      await prisma.raceWeekend.update({
        where: { id: race.id },
        data: { status: "COMPLETED" },
      });

      console.log(`[Results] ✓ Scored ${race.raceName}`);
    } catch (err) {
      console.error(`[Results] Error processing ${race.raceName}:`, err);
    }
  }
}

// ─── Cron Scheduling ────────────────────────────────────────────────────────

/** Lightweight DB ping to prevent Neon from suspending the compute */
async function keepAlive() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("[KeepAlive] DB ping failed:", err);
  }
}

/** Start background cron jobs */
export function startSyncJobs() {
  // Sync season data every day at 06:00 UTC
  new CronJob("0 6 * * *", () => syncSeasonData().catch(console.error), null, true, "UTC");

  // Check for qualifying results every 5 minutes
  new CronJob("*/5 * * * *", () => syncQualiResults().catch(console.error), null, true, "UTC");

  // Check for race results every 5 minutes
  new CronJob("*/5 * * * *", () => syncRaceResults().catch(console.error), null, true, "UTC");

  // Detect live sessions and start/stop polling every minute
  new CronJob("* * * * *", () => detectAndManageLiveSessions().catch(console.error), null, true, "UTC");

  // Keep Neon DB awake — ping every 4 minutes to stay under the 5-min idle threshold
  new CronJob("*/4 * * * *", () => keepAlive(), null, true, "UTC");

  console.log("[Cron] Sync jobs started");
}
