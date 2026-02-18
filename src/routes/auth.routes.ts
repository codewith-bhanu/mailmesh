import { Hono } from "hono";
import { signupSchema, loginSchema } from "../validators/auth";
import * as authService from "../services/auth.service";
import { success, created } from "../lib/response";
import { AppError } from "../lib/errors";

const auth = new Hono();

// POST /auth/signup
auth.post("/signup", async (c) => {
  const body = await c.req.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await authService.signup(parsed.data);
  return created(c, result);
});

// POST /auth/login
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    throw AppError.badRequest(parsed.error.issues[0].message);
  }

  const result = await authService.login(parsed.data);
  return success(c, result);
});

export default auth;
