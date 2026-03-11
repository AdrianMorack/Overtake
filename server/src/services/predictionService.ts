import prisma from "../config/database";

interface PredictionInput {
  qualiFirst: string;
  qualiSecond: string;
  qualiThird: string;
  raceFirst: string;
  raceSecond: string;
  raceThird: string;
  fastestLap: string;
  topTeam: string;
}

export async function submitPrediction(
  userId: string,
  raceWeekendId: string,
  gridId: string,
  input: PredictionInput
) {
  // Verify race weekend exists and predictions are still open
  const raceWeekend = await prisma.raceWeekend.findUnique({ where: { id: raceWeekendId } });
  if (!raceWeekend) throw new Error("Race weekend not found");

  if (new Date() > raceWeekend.predictionsLock) {
    throw new Error("Predictions are locked for this race");
  }

  // Verify user is member of grid
  const membership = await prisma.gridMembership.findUnique({
    where: { userId_gridId: { userId, gridId } },
  });
  if (!membership) throw new Error("You are not a member of this grid");

  // Upsert prediction (allows editing before lock)
  const prediction = await prisma.prediction.upsert({
    where: { userId_raceWeekendId_gridId: { userId, raceWeekendId, gridId } },
    create: { userId, raceWeekendId, gridId, ...input },
    update: { ...input },
  });

  return prediction;
}

export async function getUserPredictions(userId: string, gridId: string) {
  return prisma.prediction.findMany({
    where: { userId, gridId },
    include: { raceWeekend: true },
    orderBy: { raceWeekend: { raceDate: "asc" } },
  });
}

export async function getRacePredictions(raceWeekendId: string, gridId: string) {
  return prisma.prediction.findMany({
    where: { raceWeekendId, gridId },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { totalPoints: "desc" },
  });
}

export async function isGridMember(userId: string, gridId: string): Promise<boolean> {
  const membership = await prisma.gridMembership.findUnique({
    where: { userId_gridId: { userId, gridId } },
    select: { userId: true },
  });
  return membership !== null;
}
