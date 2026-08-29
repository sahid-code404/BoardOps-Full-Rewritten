import { app } from "./app";
import { consumeInfrastructureQueue } from "./infrastructure/queue";

export { BoardOpsFoundationWorkflow } from "./infrastructure/workflow";

const worker = {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  queue(batch) {
    return consumeInfrastructureQueue(batch);
  },
} satisfies ExportedHandler<CloudflareBindings>;

export default worker;
