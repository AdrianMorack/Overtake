import prisma from "../config/database";

export async function getRaceWeekends(season: number = 2025) {
  return prisma.raceWeekend.findMany({
    where: { season },
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

export async function getDrivers(season: number = 2025) {
  return prisma.driver.findMany({
    where: { season },
    include: { team: true },
    orderBy: { lastName: "asc" },
  });
}

export async function getTeams(season: number = 2025) {
  return prisma.team.findMany({
    where: { season },
    include: { drivers: true },
    orderBy: { name: "asc" },
  });
}
