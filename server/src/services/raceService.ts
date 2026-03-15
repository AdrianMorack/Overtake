import prisma from "../config/database";

export async function getRaceWeekends(season: number = new Date().getFullYear()) {
  return prisma.raceWeekend.findMany({
    where: { OR: [{ season }, { status: "IN_PROGRESS" }] },
    orderBy: { round: "asc" },
    include: { results: true },
  });
}

export async function getRaceWeekendById(id: string) {
  return prisma.raceWeekend.findUnique({
    where: { id },
    include: { results: true },
  });
}

export async function getDrivers(season: number = new Date().getFullYear()) {
  return prisma.driver.findMany({
    where: { season },
    include: { team: true },
    orderBy: { lastName: "asc" },
  });
}

export async function getTeams(season: number = new Date().getFullYear()) {
  return prisma.team.findMany({
    where: { season },
    include: { drivers: true },
    orderBy: { name: "asc" },
  });
}

// F1 points system (top 10 score)
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export async function getStandings(season: number = new Date().getFullYear()) {
  // Get completed races with results
  const races = await prisma.raceWeekend.findMany({
    where: { season, status: "COMPLETED", results: { isNot: null } },
    include: { results: true },
    orderBy: { round: "asc" },
  });

  // Get all drivers and teams for the season
  const drivers = await prisma.driver.findMany({
    where: { season },
    include: { team: true },
  });

  // Build driver standings from race results
  const driverPoints = new Map<string, { code: string; name: string; teamName: string; teamColor: string | null; points: number; wins: number }>();
  const teamPoints = new Map<string, { name: string; color: string | null; points: number; wins: number }>();

  // Initialize all drivers/teams
  for (const d of drivers) {
    driverPoints.set(d.code, {
      code: d.code,
      name: `${d.firstName} ${d.lastName}`,
      teamName: d.team?.name ?? "Unknown",
      teamColor: d.team?.color ?? null,
      points: 0,
      wins: 0,
    });
    if (d.team && !teamPoints.has(d.team.name)) {
      teamPoints.set(d.team.name, { name: d.team.name, color: d.team.color, points: 0, wins: 0 });
    }
  }

  // Tally points from race results
  for (const race of races) {
    if (!race.results) continue;
    const r = race.results;
    const raceOrder = [r.raceFirst, r.raceSecond, r.raceThird].filter(Boolean) as string[];

    for (let i = 0; i < raceOrder.length && i < F1_POINTS.length; i++) {
      const code = raceOrder[i];
      const entry = driverPoints.get(code);
      if (entry) {
        entry.points += F1_POINTS[i];
        if (i === 0) entry.wins++;
        // Add to team tally
        const team = teamPoints.get(entry.teamName);
        if (team) {
          team.points += F1_POINTS[i];
          if (i === 0) team.wins++;
        }
      }
    }

    // Fastest lap bonus: +1 point if driver finished in top 10
    if (r.fastestLap) {
      const flEntry = driverPoints.get(r.fastestLap);
      if (flEntry) {
        flEntry.points += 1;
        const team = teamPoints.get(flEntry.teamName);
        if (team) team.points += 1;
      }
    }
  }

  const driverStandings = Array.from(driverPoints.values())
    .sort((a, b) => b.points - a.points || b.wins - a.wins);

  const teamStandings = Array.from(teamPoints.values())
    .sort((a, b) => b.points - a.points || b.wins - a.wins);

  return { driverStandings, teamStandings, racesCompleted: races.length };
}
