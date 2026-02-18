import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import { db } from "../db/db-client";
import { users, workspaces } from "../db/schema";
import { AppError } from "../lib/errors";
import { env } from "../config/env";
import { eq } from "drizzle-orm";
import type { SignupInput, LoginInput } from "../validators/auth";

export async function signup(input: SignupInput) {
  // Check existing user
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    throw AppError.conflict("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      password: hashedPassword,
      first_name: input.first_name,
      last_name: input.last_name,
    })
    .returning();

  // Create default workspace
  const slug = input.workspace_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const [workspace] = await db
    .insert(workspaces)
    .values({
      user_id: user.id,
      name: input.workspace_name,
      slug: `${slug}-${Date.now().toString(36)}`,
    })
    .returning();

  const token = await generateToken(user.id, workspace.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    token,
  };
}

export async function login(input: LoginInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) {
    throw AppError.unauthorized("Invalid email or password");
  }

  if (!user.is_active) {
    throw AppError.forbidden("Account is deactivated");
  }

  // Get first workspace
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.user_id, user.id))
    .limit(1);

  if (!workspace) {
    throw AppError.internal("No workspace found for user");
  }

  const token = await generateToken(user.id, workspace.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    token,
  };
}

async function generateToken(
  userId: string,
  workspaceId: string,
): Promise<string> {
  return sign(
    {
      userId,
      workspaceId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    env.JWT_SECRET,
  );
}
