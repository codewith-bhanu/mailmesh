import { Hono } from "hono";

import { AuthHandler } from "@/handlers/auth-handler";

const auth = new Hono();

const authHandler = new AuthHandler();

// POST /auth/signup
auth.post("/signup", authHandler.signup);

// POST /auth/login
auth.post("/login", authHandler.login);

export default auth;
