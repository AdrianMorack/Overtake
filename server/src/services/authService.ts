import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/database";
import { env } from "../config/env";
import { AuthPayload } from "../middleware/auth";

const SALT_ROUNDS = 12;

function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { algorithm: "HS256", expiresIn: env.jwtAccessExpiry });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
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
    throw new Error("Registration failed — email or username already in use");
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
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new Error("Invalid or expired refresh token");
  }

  // For admin users (bot accounts), keep the same refresh token for GitHub Actions
  // For regular users, rotate the refresh token for better security
  const isAdmin = env.adminUserIds.includes(stored.user.id);
  
  if (isAdmin) {
    // Don't rotate - just issue new access token with same refresh token
    const payload: AuthPayload = { userId: stored.user.id, email: stored.user.email };
    const accessToken = generateAccessToken(payload);
    return { accessToken, refreshToken }; // Return original refresh token
  } else {
    // Rotate refresh token for regular users
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await createTokens(stored.user.id, stored.user.email);
    return tokens;
  }
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
}

async function createTokens(userId: string, email: string) {
  const payload: AuthPayload = { userId, email };
  const accessToken = generateAccessToken(payload);
  const refreshTokenValue = generateRefreshToken();
  const tokenHash = hashToken(refreshTokenValue);

  // Clean up expired tokens for this user
  await prisma.refreshToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}
