import type { Context } from "hono";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Extract pagination params from query string.
 * Defaults: page=1, limit=20, max limit=100.
 */
export function getPagination(c: Context): PaginationParams {
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
