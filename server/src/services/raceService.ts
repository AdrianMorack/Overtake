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
