import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required in production");
  if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET env var is required in production");
  if (!process.env.POSTGRES_PASSWORD && !process.env.DATABASE_URL) throw new Error("DATABASE_URL env var is required in production");
}

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change_me_dev_only",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change_me_refresh_dev_only",
  jwtAccessExpiry: "15m",
  jwtRefreshExpiry: "7d",
  fastF1BaseUrl: process.env.FASTF1_BASE_URL || "http://localhost:8100",
  fastF1ServiceUrl: process.env.FASTF1_SERVICE_URL || "http://localhost:8100",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
} as const;
