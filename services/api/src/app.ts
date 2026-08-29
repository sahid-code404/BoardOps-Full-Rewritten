import { Hono } from "hono";
import { requestId } from "hono/request-id";

import type { AppEnv } from "./app-env";
import { authRoutes } from "./auth/routes";
import { devRoutes } from "./dev/routes";
import { apiErrorResponse } from "./http/error-response";
import { readinessSnapshot } from "./infrastructure/database-readiness";
import { requestLogging } from "./observability/request-logging";

export const app = new Hono<AppEnv>();

app.use("*", requestId());
app.use("*", requestLogging());

app.get("/api/v1/health", (c) =>
  c.json({
    status: "ok",
    service: "boardops-api",
    apiVersion: "v1",
    requestId: c.get("requestId"),
  }),
);

app.get("/api/v1/ready", async (c) => {
  const snapshot = await readinessSnapshot(c.env);
  return c.json(
    {
      status: snapshot.ready ? "ready" : "not_ready",
      service: "boardops-api",
      apiVersion: "v1",
      resources: snapshot.resources,
      requestId: c.get("requestId"),
    },
    snapshot.ready ? 200 : 503,
  );
});

app.get("/api/v1/meta", (c) =>
  c.json({
    environment: c.env.BOARDOPS_ENV,
    apiVersion: "v1",
    requestId: c.get("requestId"),
  }),
);

app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/dev", devRoutes);

app.notFound((c) =>
  c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
        requestId: c.get("requestId"),
      },
    },
    404,
  ),
);

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      level: "error",
      event: "http_error",
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      errorName: error.name,
      message: error.message,
    }),
  );
  return apiErrorResponse(c, error);
});
