import { Hono } from "hono";
import { requestId } from "hono/request-id";

export type AppEnv = { Bindings: CloudflareBindings };

export const app = new Hono<AppEnv>();

app.use("*", requestId());

app.get("/api/v1/health", (c) =>
  c.json({
    status: "ok",
    service: "boardops-api",
    apiVersion: "v1",
    requestId: c.get("requestId"),
  }),
);

app.get("/api/v1/meta", (c) =>
  c.json({
    environment: c.env?.BOARDOPS_ENV ?? "development",
    apiVersion: "v1",
    requestId: c.get("requestId"),
  }),
);

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
      requestId: c.get("requestId"),
      route: c.req.path,
      message: error.message,
    }),
  );
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        requestId: c.get("requestId"),
      },
    },
    500,
  );
});

export default app;
