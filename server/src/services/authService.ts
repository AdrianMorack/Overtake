import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/database";
import { env } from "../config/env";
import { AuthPayload } from "../middleware/auth";

const SALT_ROUNDS = 12;

function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtAccessExpiry });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export async function updateProfile(userId: string, favoriteTeam: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { favoriteTeam },
    select: { id: true, email: true, username: true, favoriteTeam: true },
  });
  return { user };
}

export async function register(email: string, username: string, password: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new Error(existing.email === email ? "Email already registered" : "Username taken");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  const tokens = await createTokens(user.id, user.email);
  return { user: { id: user.id, email: user.email, username: user.username }, ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  const tokens = await createTokens(user.id, user.email);
  return { user: { id: user.id, email: user.email, username: user.username }, ...tokens };
}

export async function refreshAccessToken(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new Error("Invalid or expired refresh token");
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const tokens = await createTokens(stored.user.id, stored.user.email);
  return tokens;
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

async function createTokens(userId: string, email: string) {
  const payload: AuthPayload = { userId, email };
  const accessToken = generateAccessToken(payload);
  const refreshTokenValue = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}
