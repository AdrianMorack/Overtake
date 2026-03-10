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

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Support token in Authorization header OR ?token= query param (needed for EventSource / SSE)
  const header = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  const raw = header?.startsWith("Bearer ") ? header.slice(7) : queryToken;
  if (!raw) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  try {
    const payload = jwt.verify(raw, env.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
