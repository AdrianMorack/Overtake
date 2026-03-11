import { Router, Request, Response } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as authService from "../services/authService";

// Strict rate limit for auth endpoints: 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again in 15 minutes." },
});

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

router.post("/register", authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body.email, req.body.username, req.body.password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post("/refresh", authLimiter, validate(refreshSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post("/logout", authenticate, validate(refreshSchema), async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.json({ message: "Logged out" });
});

const ALLOWED_TEAMS = ["ferrari", "mercedes", "redbull", "mclaren", "alpine", "astonmartin", "williams", "haas", "racingbulls", "cadillac", "audi"];

router.patch("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const { favoriteTeam } = req.body;
    if (!favoriteTeam || !ALLOWED_TEAMS.includes(favoriteTeam)) {
      res.status(400).json({ error: "Invalid favoriteTeam value" });
      return;
    }
    const result = await authService.updateProfile(req.user!.userId, favoriteTeam);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
