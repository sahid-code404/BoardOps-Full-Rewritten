import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "../app-env";

export function requestLogging(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const startedAt = Date.now();
    await next();
    console.log(
      JSON.stringify({
        level: "info",
        event: "http_request",
        requestId: c.get("requestId"),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - startedAt,
        environment: c.env.BOARDOPS_ENV,
      }),
    );
  };
}
