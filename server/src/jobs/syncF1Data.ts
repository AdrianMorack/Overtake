import { CronJob } from "cron";
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
  const { races, qualis } = await fastF1.getRaceAndQualiSessions(year);
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
  if (races.length > 0) {
    const drivers = await fastF1.getSessionDrivers(races[0].session_key);
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
 * Fetch official race results for completed races and score predictions.
 * Runs regularly (e.g. every 30 min on race days, or a few times daily).
 */
export async function syncRaceResults() {
  console.log(`[Results] Checking for new race results…`);

  // Find race weekends past their race date that haven't been completed yet
  const pending = await prisma.raceWeekend.findMany({
    where: {
      status: { not: "COMPLETED" },
      raceDate: { lt: new Date() },
      externalId: { not: null },
    },
  });

  for (const race of pending) {
    if (!race.externalId) continue;

    try {
      // Get race final positions
      const racePositions = await fastF1.getFinalPositions(race.externalId);
      if (racePositions.length < 3) {
        console.log(`[Results] Race ${race.raceName}: insufficient position data yet`);
        continue;
      }

      // Get qualifying final positions using the stored qualiSessionKey
      let qualiPositions: Awaited<ReturnType<typeof fastF1.getFinalPositions>> = [];
      if (race.qualiSessionKey) {
        qualiPositions = await fastF1.getFinalPositions(race.qualiSessionKey);
      }

      // Get fastest lap
      const fastestLapDriverNum = await fastF1.getFastestLapDriver(race.externalId);

      // Resolve driver numbers → codes
      const drivers = await fastF1.getSessionDrivers(race.externalId);
      const driverByNum = new Map(drivers.map((d) => [d.driver_number, d]));

      const codeFor = (num: number) => driverByNum.get(num)?.name_acronym ?? "UNK";
      const teamFor = (num: number) => driverByNum.get(num)?.team_name ?? "Unknown";

      // Determine top team (team of P1 + P2 combined, simplified as team of winner)
      // A more accurate approach sums points of all drivers per team
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

      // Score all predictions
      await scoreRace(race.id);

      console.log(`[Results] ✓ Scored ${race.raceName}`);
    } catch (err) {
      console.error(`[Results] Error processing ${race.raceName}:`, err);
    }
  }
}

// ─── Cron Scheduling ────────────────────────────────────────────────────────

/** Start background cron jobs */
export function startSyncJobs() {
  // Sync season data every day at 06:00 UTC
  new CronJob("0 6 * * *", () => syncSeasonData().catch(console.error), null, true, "UTC");

  // Check for race results every 30 minutes
  new CronJob("*/30 * * * *", () => syncRaceResults().catch(console.error), null, true, "UTC");

  // Detect live sessions and start/stop polling every minute
  new CronJob("* * * * *", () => detectAndManageLiveSessions().catch(console.error), null, true, "UTC");

  console.log("[Cron] Sync jobs started");
}
