import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Paths that are allowed to accept tokens via query parameter (SSE endpoints)
const QUERY_TOKEN_PATHS = /\/api\/live\/[^/]+\/stream$/;

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  let raw = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  // Only accept query-param tokens for SSE stream endpoints
  if (!raw && QUERY_TOKEN_PATHS.test(req.path)) {
    raw = req.query.token as string | undefined;
  }

  if (!raw) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  try {
    const payload = jwt.verify(raw, env.jwtSecret, { algorithms: ["HS256"] }) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorizeAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !env.adminUserIds.includes(req.user.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
