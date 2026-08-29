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

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
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
  session: {
    id: string;
    clientType: "WEB" | "MOBILE";
    stepUpVerifiedAtMs: number | null;
  };
}

export interface DeviceSession {
  id: string;
  client_type: "WEB" | "MOBILE";
  device_name: string | null;
  user_agent: string | null;
  created_at_ms: number;
  last_seen_at_ms: number;
  expires_at_ms: number;
  revoked_at_ms: number | null;
  step_up_verified_at_ms: number | null;
}

export const authApi = {
  bootstrapDemo: () =>
    apiRequest<{
      institutionSlug: string;
      identifier: string;
      password: string;
    }>("/dev/bootstrap", { method: "POST", body: "{}" }),

  login: (input: {
    institutionSlug: string;
    identifier: string;
    password: string;
  }) =>
    apiRequest<{ accountState: string }>("/auth/login", {
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
    apiRequest<{
      status: string;
      userId: string;
      developmentVerificationToken?: string;
    }>("/auth/register", { method: "POST", body: JSON.stringify(input) }),

  verifyEmail: (token: string) =>
    apiRequest<{ status: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  requestPasswordReset: (input: {
    institutionSlug: string;
    identifier: string;
  }) =>
    apiRequest<{ status: string; developmentResetToken?: string }>(
      "/auth/password-reset/request",
      { method: "POST", body: JSON.stringify(input) },
    ),

  confirmPasswordReset: (token: string, newPassword: string) =>
    apiRequest<{ status: string }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  me: () => apiRequest<MeResponse>("/auth/me"),

  logout: () =>
    apiRequest<{ status: string }>("/auth/logout", {
      method: "POST",
      body: "{}",
    }),

  sessions: () => apiRequest<{ sessions: DeviceSession[] }>("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    apiRequest<{ status: string }>(
      `/auth/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    ),

  requestOtp: () =>
    apiRequest<{
      status: string;
      challengeId: string;
      expiresAtMs: number;
      developmentOtpCode?: string;
    }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ purpose: "STEP_UP" }),
    }),

  verifyOtp: (challengeId: string, code: string) =>
    apiRequest<{ status: string; verifiedAtMs: number }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ challengeId, code }),
    }),

  registrations: () =>
    apiRequest<{ registrations: Array<Record<string, unknown>> }>(
      "/auth/registrations",
    ),

  reviewRegistration: (
    userId: string,
    action: "APPROVE" | "REJECT" | "REQUEST_CHANGES",
    reason?: string,
  ) =>
    apiRequest<{ status: string }>(
      `/auth/registrations/${encodeURIComponent(userId)}/review`,
      {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      },
    ),
};
