import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change_me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change_me_refresh",
  jwtAccessExpiry: "15m",
  jwtRefreshExpiry: "7d",
  openF1BaseUrl: process.env.OPENF1_BASE_URL || "https://api.openf1.org/v1",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
} as const;
