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
export async function getStandings(season: number = new Date().getFullYear()) {
  // Fetch official standings from Jolpica/Ergast F1 API (accurate top-10 points)
  try {
    const [driverRes, constructorRes] = await Promise.all([
      fetch(`https://api.jolpi.ca/ergast/f1/${season}/driverStandings.json`),
      fetch(`https://api.jolpi.ca/ergast/f1/${season}/constructorStandings.json`),
    ]);

    if (!driverRes.ok || !constructorRes.ok) throw new Error("Jolpica API error");

    const [driverJson, constructorJson] = await Promise.all([
      driverRes.json() as Promise<any>,
      constructorRes.json() as Promise<any>,
    ]);

    const standingsLists = driverJson?.MRData?.StandingsTable?.StandingsLists ?? [];
    const constructorLists = constructorJson?.MRData?.StandingsTable?.StandingsLists ?? [];

    const racesCompleted: number = standingsLists[0]?.round ? parseInt(standingsLists[0].round, 10) : 0;

    // Get local driver data for team colors
    const drivers = await prisma.driver.findMany({ where: { season }, include: { team: true } });
    const driverColorMap = new Map(drivers.map(d => [d.code, d.team?.color ?? null]));

    const driverStandings = (standingsLists[0]?.DriverStandings ?? []).map((s: any) => ({
      code: s.Driver?.code ?? s.Driver?.familyName?.slice(0, 3).toUpperCase(),
      name: `${s.Driver?.givenName} ${s.Driver?.familyName}`,
      teamName: s.Constructors?.[0]?.name ?? "Unknown",
      teamColor: driverColorMap.get(s.Driver?.code ?? "") ?? null,
      points: parseInt(s.points, 10),
      wins: parseInt(s.wins, 10),
    }));

    const teamStandings = (constructorLists[0]?.ConstructorStandings ?? []).map((s: any) => {
      // Find team color from our DB by matching name
      const team = drivers.find(d => d.team?.name === s.Constructor?.name)?.team;
      return {
        name: s.Constructor?.name ?? "Unknown",
        color: team?.color ?? null,
        points: parseInt(s.points, 10),
        wins: parseInt(s.wins, 10),
      };
    });

    return { driverStandings, teamStandings, racesCompleted };
  } catch (err) {
    console.error("[Standings] Jolpica API failed, falling back to local calc:", err);
    return getStandingsLocal(season);
  }
}

// Fallback: calculate from stored top-3 results (less accurate)
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
async function getStandingsLocal(season: number) {
  const races = await prisma.raceWeekend.findMany({
    where: { season, status: "COMPLETED", results: { isNot: null } },
    include: { results: true },
    orderBy: { round: "asc" },
  });
  const drivers = await prisma.driver.findMany({ where: { season }, include: { team: true } });

  const driverPoints = new Map<string, { code: string; name: string; teamName: string; teamColor: string | null; points: number; wins: number }>();
  const teamPoints = new Map<string, { name: string; color: string | null; points: number; wins: number }>();

  for (const d of drivers) {
    driverPoints.set(d.code, { code: d.code, name: `${d.firstName} ${d.lastName}`, teamName: d.team?.name ?? "Unknown", teamColor: d.team?.color ?? null, points: 0, wins: 0 });
    if (d.team && !teamPoints.has(d.team.name)) teamPoints.set(d.team.name, { name: d.team.name, color: d.team.color, points: 0, wins: 0 });
  }

  for (const race of races) {
    if (!race.results) continue;
    const r = race.results;
    const order = [r.raceFirst, r.raceSecond, r.raceThird].filter(Boolean) as string[];
    for (let i = 0; i < order.length; i++) {
      const entry = driverPoints.get(order[i]);
      if (entry) {
        entry.points += F1_POINTS[i];
        if (i === 0) entry.wins++;
        const team = teamPoints.get(entry.teamName);
        if (team) { team.points += F1_POINTS[i]; if (i === 0) team.wins++; }
      }
    }
    if (r.fastestLap) {
      const fl = driverPoints.get(r.fastestLap);
      if (fl) { fl.points += 1; const t = teamPoints.get(fl.teamName); if (t) t.points += 1; }
    }
  }

  return {
    driverStandings: Array.from(driverPoints.values()).sort((a, b) => b.points - a.points || b.wins - a.wins),
    teamStandings: Array.from(teamPoints.values()).sort((a, b) => b.points - a.points || b.wins - a.wins),
    racesCompleted: races.length,
  };
}
