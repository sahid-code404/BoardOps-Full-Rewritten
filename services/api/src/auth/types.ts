export const accountStates = [
  "PENDING_EMAIL_VERIFICATION",
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
  "ARCHIVED",
  "REJECTED",
] as const;

export type AccountState = (typeof accountStates)[number];
export type ClientType = "WEB" | "MOBILE";

export interface AuthPrincipal {
  sessionId: string;
  userId: string;
  institutionId: string;
  institutionSlug: string;
  institutionUserId: string;
  email: string;
  displayName: string;
  accountState: AccountState;
  clientType: ClientType;
  stepUpVerifiedAtMs: number | null;
  permissions: string[];
}

export interface AuthUserRow {
  id: string;
  institution_id: string;
  institution_slug: string;
  institution_user_id: string;
  email: string;
  email_normalized: string;
  display_name: string;
  account_state: AccountState;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  locked_until_ms: number | null;
}
