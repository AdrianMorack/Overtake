import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (process.env.NODE_ENV !== "production") {
    console.error("[Error]", err.message, err.stack);
  } else {
    console.error("[Error]", err.message);
  }
  res.status(500).json({ error: "Internal server error" });
}
