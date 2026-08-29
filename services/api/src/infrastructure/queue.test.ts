import { describe, expect, it } from "vitest";

import { isInfrastructureQueueMessage } from "./queue";

describe("queue message boundary", () => {
  it("accepts only versioned outbox dispatch messages", () => {
    expect(
      isInfrastructureQueueMessage({
        version: 1,
        kind: "outbox-dispatch",
        eventId: "evt_1",
        correlationId: "req_1",
      }),
    ).toBe(true);

    expect(
      isInfrastructureQueueMessage({
        version: 1,
        kind: "unknown",
        eventId: "evt_1",
        correlationId: "req_1",
      }),
    ).toBe(false);
    expect(isInfrastructureQueueMessage(null)).toBe(false);
  });
});
