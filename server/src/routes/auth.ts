import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as authService from "../services/authService";

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

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body.email, req.body.username, req.body.password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post("/refresh", validate(refreshSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.post("/logout", validate(refreshSchema), async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.json({ message: "Logged out" });
});

export default router;
