import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

export interface FoundationWorkflowParams {
  operationId: string;
  kind: "foundation-probe";
}

export class BoardOpsFoundationWorkflow extends WorkflowEntrypoint<
  CloudflareBindings,
  FoundationWorkflowParams
> {
  async run(
    event: WorkflowEvent<FoundationWorkflowParams>,
    step: WorkflowStep,
  ) {
    return step.do("accept foundation workflow operation", async () => ({
      accepted: true,
      kind: event.payload.kind,
      operationId: event.payload.operationId,
    }));
  }
}
