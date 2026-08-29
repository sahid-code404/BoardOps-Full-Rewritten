export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
}

export class WebApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "WebApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  const payload = (await response.json()) as T & ApiErrorPayload;
  if (!response.ok) {
    throw new WebApiError(
      response.status,
      payload.error?.code ?? "REQUEST_FAILED",
      payload.error?.message ?? "Request failed.",
    );
  }
  return payload;
}

export interface MeResponse {
  user: {
    id: string;
    institutionId: string;
    institutionSlug: string;
    institutionUserId: string;
    email: string;
    displayName: string;
    accountState: string;
    permissions: string[];
  };
  session: { id: string; clientType: "WEB" | "MOBILE" };
}

export const authApi = {
  bootstrapDemo: () =>
    request<{
      institutionSlug: string;
      identifier: string;
      password: string;
    }>("/dev/bootstrap", { method: "POST", body: "{}" }),

  login: (input: {
    institutionSlug: string;
    identifier: string;
    password: string;
  }) =>
    request<{ accountState: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        clientType: "WEB",
        deviceName: "Web browser",
      }),
    }),

  register: (input: {
    institutionSlug: string;
    institutionUserId: string;
    displayName: string;
    email: string;
    password: string;
  }) =>
    request<{
      status: string;
      userId: string;
      developmentVerificationToken?: string;
    }>("/auth/register", { method: "POST", body: JSON.stringify(input) }),

  verifyEmail: (token: string) =>
    request<{ status: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  me: () => request<MeResponse>("/auth/me"),

  logout: () =>
    request<{ status: string }>("/auth/logout", { method: "POST", body: "{}" }),

  sessions: () =>
    request<{ sessions: Array<Record<string, unknown>> }>("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    request<{ status: string }>(
      `/auth/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
      },
    ),

  registrations: () =>
    request<{ registrations: Array<Record<string, unknown>> }>(
      "/auth/registrations",
    ),

  reviewRegistration: (
    userId: string,
    action: "APPROVE" | "REJECT" | "REQUEST_CHANGES",
    reason?: string,
  ) =>
    request<{ status: string }>(
      `/auth/registrations/${encodeURIComponent(userId)}/review`,
      {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      },
    ),
};
