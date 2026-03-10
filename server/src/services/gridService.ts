import crypto from "crypto";
import prisma from "../config/database";

function generateGridCode(): string {
  // 6-digit alphanumeric code (uppercase)
  return crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
}

export async function createGrid(name: string, ownerId: string, season: number = new Date().getFullYear()) {
  let code: string;
  // Ensure uniqueness
  do {
    code = generateGridCode();
  } while (await prisma.grid.findUnique({ where: { code } }));

  const grid = await prisma.grid.create({
    data: { name, code, ownerId, season },
  });

  // Auto-join the creator
  await prisma.gridMembership.create({
    data: { userId: ownerId, gridId: grid.id },
  });

  return grid;
}

export async function joinGrid(code: string, userId: string) {
  const grid = await prisma.grid.findUnique({ where: { code } });
  if (!grid) throw new Error("Grid not found");

  const existing = await prisma.gridMembership.findUnique({
    where: { userId_gridId: { userId, gridId: grid.id } },
  });
  if (existing) throw new Error("Already a member of this grid");

  await prisma.gridMembership.create({
    data: { userId, gridId: grid.id },
  });

  return grid;
}

export async function getUserGrids(userId: string) {
  const memberships = await prisma.gridMembership.findMany({
    where: { userId },
    include: {
      grid: {
        include: {
          memberships: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        },
      },
    },
  });
  type Membership = (typeof memberships)[number];
  return memberships.map((m: Membership) => m.grid);
}

export async function getGridLeaderboard(gridId: string, season?: number) {
  const memberships = await prisma.gridMembership.findMany({
    where: { gridId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          predictions: {
            where: { gridId },
            select: { totalPoints: true, raceWeekendId: true },
          },
        },
      },
    },
  });

  type LeaderboardRow = {
    userId: string;
    username: string;
    avatarUrl: string | null;
    totalPoints: number;
    racesPlayed: number;
  };

  type Membership = (typeof memberships)[number];

  const leaderboard: LeaderboardRow[] = memberships
    .map((m: Membership) => ({
      userId: m.user.id,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      totalPoints: m.user.predictions.reduce(
        (sum: number, p: { totalPoints: number }) => sum + p.totalPoints,
        0
      ),
      racesPlayed: m.user.predictions.length,
    }))
    .sort((a: LeaderboardRow, b: LeaderboardRow) => b.totalPoints - a.totalPoints);

  return leaderboard;
}
