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

  // Auto-join the creator as ACTIVE
  await prisma.gridMembership.create({
    data: { userId: ownerId, gridId: grid.id, status: "ACTIVE" },
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
    data: { userId, gridId: grid.id, status: "PENDING" },
  });

  return grid;
}

export async function getUserGrids(userId: string) {
  const memberships = await prisma.gridMembership.findMany({
    where: { userId },
    include: {
      grid: {
        include: {
          memberships: {
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
          },
        },
      },
    },
  });
  type Membership = (typeof memberships)[number];
  return memberships.map((m: Membership) => ({ ...m.grid, memberStatus: m.status }));
}

export async function getGrid(gridId: string) {
  const grid = await prisma.grid.findUnique({
    where: { id: gridId },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!grid) throw new Error("Grid not found");
  return grid;
}

export async function updateGrid(gridId: string, data: { name?: string }, userId: string) {
  const grid = await prisma.grid.findUnique({ where: { id: gridId } });
  if (!grid) throw new Error("Grid not found");
  if (grid.ownerId !== userId) throw new Error("Only the grid owner can update the grid");

  return prisma.grid.update({
    where: { id: gridId },
    data,
  });
}

export async function deleteGrid(gridId: string, userId: string) {
  const grid = await prisma.grid.findUnique({ where: { id: gridId } });
  if (!grid) throw new Error("Grid not found");
  if (grid.ownerId !== userId) throw new Error("Only the grid owner can delete the grid");

  // Delete all memberships and predictions first (cascading deletes handled by Prisma)
  await prisma.grid.delete({ where: { id: gridId } });
}

export async function approveMember(gridId: string, targetUserId: string, requesterId: string) {
  const grid = await prisma.grid.findUnique({ where: { id: gridId } });
  if (!grid) throw new Error("Grid not found");
  if (grid.ownerId !== requesterId) throw new Error("Only the grid owner can approve members");

  const membership = await prisma.gridMembership.findUnique({
    where: { userId_gridId: { userId: targetUserId, gridId } },
  });
  if (!membership) throw new Error("User is not a member of this grid");
  if (membership.status === "ACTIVE") throw new Error("User is already approved");

  return prisma.gridMembership.update({
    where: { userId_gridId: { userId: targetUserId, gridId } },
    data: { status: "ACTIVE" },
  });
}

export async function removeMember(gridId: string, targetUserId: string, userId: string) {
  const grid = await prisma.grid.findUnique({ where: { id: gridId } });
  if (!grid) throw new Error("Grid not found");
  if (grid.ownerId !== userId) throw new Error("Only the grid owner can remove members");
  if (grid.ownerId === targetUserId) throw new Error("Cannot remove the grid owner");

  const membership = await prisma.gridMembership.findUnique({
    where: { userId_gridId: { userId: targetUserId, gridId } },
  });
  if (!membership) throw new Error("User is not a member of this grid");

  await prisma.gridMembership.delete({
    where: { userId_gridId: { userId: targetUserId, gridId } },
  });
}

export async function getGridLeaderboard(gridId: string, season?: number) {
  const memberships = await prisma.gridMembership.findMany({
    where: { gridId, status: "ACTIVE" },
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
