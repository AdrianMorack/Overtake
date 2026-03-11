import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required in production");
  if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET env var is required in production");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL env var is required in production");
  const origin = process.env.CORS_ORIGIN;
  if (!origin || origin === "*") throw new Error("CORS_ORIGIN must be a specific origin in production");
}

// In development, generate random secrets so they're never predictable defaults
const devSecret = () => crypto.randomBytes(32).toString("hex");

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || devSecret(),
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || devSecret(),
  jwtAccessExpiry: "15m",
  jwtRefreshExpiry: "7d",
  fastF1BaseUrl: process.env.FASTF1_BASE_URL || "http://localhost:8100",
  fastF1ServiceUrl: process.env.FASTF1_SERVICE_URL || "http://localhost:8100",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  adminUserIds: process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(",").map(s => s.trim()) : [],
} as const;
