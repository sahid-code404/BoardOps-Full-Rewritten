import type { AuthPrincipal } from "./auth/types";

export type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: {
    auth?: AuthPrincipal;
    requestId: string;
  };
};
