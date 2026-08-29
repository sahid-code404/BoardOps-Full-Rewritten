import { describe, expect, it } from "vitest";

import { app } from "./app";

function testBindings(databaseReady = true): CloudflareBindings {
  return {
    BOARDOPS_ENV: "test",
    DB: {
      prepare: () => ({
        first: async () => (databaseReady ? { ok: 1 } : null),
      }),
    },
    FILES: {},
    EVENT_QUEUE: {},
    FOUNDATION_WORKFLOW: {},
  } as unknown as CloudflareBindings;
}

describe("BoardOps API foundation", () => {
  it("returns a versioned liveness response", async () => {
    const response = await app.request(
      "/api/v1/health",
      {},
      testBindings(),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      status: "ok",
      service: "boardops-api",
      apiVersion: "v1",
    });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("reports readiness only when required bindings are usable", async () => {
    const ready = await app.request("/api/v1/ready", {}, testBindings());
    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({
      status: "ready",
      resources: { d1: true, r2: true, queue: true, workflow: true },
    });

    const unavailable = await app.request(
      "/api/v1/ready",
      {},
      testBindings(false),
    );
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toMatchObject({
      status: "not_ready",
      resources: { d1: false },
    });
  });

  it("returns the safe error envelope for unknown routes", async () => {
    const response = await app.request("/missing", {}, testBindings());
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});
