export interface InfrastructureQueueMessage {
  version: 1;
  kind: "outbox-dispatch";
  eventId: string;
  correlationId: string;
}

export function isInfrastructureQueueMessage(
  value: unknown,
): value is InfrastructureQueueMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    candidate.kind === "outbox-dispatch" &&
    typeof candidate.eventId === "string" &&
    candidate.eventId.length > 0 &&
    typeof candidate.correlationId === "string" &&
    candidate.correlationId.length > 0
  );
}

export async function consumeInfrastructureQueue(
  batch: MessageBatch<unknown>,
): Promise<void> {
  for (const message of batch.messages) {
    if (!isInfrastructureQueueMessage(message.body)) {
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "queue_message_rejected",
          queue: batch.queue,
          messageId: message.id,
        }),
      );
      message.ack();
      continue;
    }

    console.log(
      JSON.stringify({
        level: "info",
        event: "queue_message_received",
        queue: batch.queue,
        messageId: message.id,
        outboxEventId: message.body.eventId,
        correlationId: message.body.correlationId,
      }),
    );
    message.ack();
  }
}
