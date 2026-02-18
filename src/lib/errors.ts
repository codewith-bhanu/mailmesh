import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  public readonly statusCode: ContentfulStatusCode;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: ContentfulStatusCode = 400,
    code = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message: string) {
    return new AppError(message, 400, "BAD_REQUEST");
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static conflict(message: string) {
    return new AppError(message, 409, "CONFLICT");
  }

  static tooManyRequests(message = "Too many requests") {
    return new AppError(message, 429, "RATE_LIMITED");
  }

  static internal(message = "Internal server error") {
    return new AppError(message, 500, "INTERNAL_ERROR");
  }
}

/**
 * Global error handler middleware for Hono.
 */
export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.statusCode,
    );
  }

  console.error("Unhandled error:", err);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
}
