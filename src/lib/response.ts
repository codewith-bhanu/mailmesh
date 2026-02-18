import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function success<T>(
  c: Context,
  data: T,
  status: ContentfulStatusCode = 200,
  meta?: Record<string, unknown>,
) {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return c.json(body, status);
}

export function paginated<T>(
  c: Context,
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return c.json(body, 200);
}

export function created<T>(c: Context, data: T) {
  return success(c, data, 201);
}

export function noContent(c: Context) {
  return c.body(null, 204);
}
