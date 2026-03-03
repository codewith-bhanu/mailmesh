import { AppError } from "@/lib/errors";
import { created, success } from "@/lib/response";
import { loginSchema, signupSchema } from "@/validators/auth";
import type { Context } from "hono";

import * as authService from "../services/auth.service";

export class AuthHandler {
  signup = async (c: Context) => {
    const body = await c.req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0].message);
    }

    const result = await authService.signup(parsed.data);
    return created(c, result);
  };

  login = async (c: Context) => {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0].message);
    }

    const result = await authService.login(parsed.data);
    return success(c, result);
  };
}
