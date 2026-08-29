import type { Context } from "hono";

import type { AppEnv } from "../app-env";
import { ApiError } from "./api-error";

export function apiErrorResponse(c: Context<AppEnv>, error: unknown) {
  const requestId = c.get("requestId");
  if (error instanceof ApiError) {
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
          requestId,
        },
      },
      error.status,
    );
  }

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        requestId,
      },
    },
    500,
  );
}
