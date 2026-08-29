PRAGMA foreign_keys = ON;

ALTER TABLE institutions
  ADD COLUMN institution_user_id_label TEXT NOT NULL DEFAULT 'Institution User ID';

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT NOT NULL,
  institution_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  display_name TEXT NOT NULL,
  account_state TEXT NOT NULL CHECK (
    account_state IN (
      'PENDING_EMAIL_VERIFICATION',
      'PENDING_REVIEW',
      'CHANGES_REQUESTED',
      'APPROVED',
      'ACTIVE',
      'RESTRICTED',
      'SUSPENDED',
      'ARCHIVED',
      'REJECTED'
    )
  ),
  email_verified_at_ms INTEGER,
  approved_at_ms INTEGER,
  approved_by_user_id TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (institution_id, institution_user_id),
  UNIQUE (institution_id, email_normalized)
);

CREATE INDEX idx_users_institution_state
  ON users(institution_id, account_state, created_at_ms);
CREATE INDEX idx_users_institution_email
  ON users(institution_id, email_normalized);

CREATE TABLE account_state_events (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  reason TEXT,
  actor_user_id TEXT,
  correlation_id TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_account_state_events_user
  ON account_state_events(institution_id, user_id, created_at_ms);

CREATE TRIGGER account_state_events_no_update
BEFORE UPDATE ON account_state_events
BEGIN
  SELECT RAISE(ABORT, 'account_state_events are append-only');
END;

CREATE TRIGGER account_state_events_no_delete
BEFORE DELETE ON account_state_events
BEGIN
  SELECT RAISE(ABORT, 'account_state_events are append-only');
END;

CREATE TABLE password_credentials (
  user_id TEXT PRIMARY KEY NOT NULL,
  algorithm TEXT NOT NULL CHECK (algorithm = 'PBKDF2-SHA256'),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until_ms INTEGER,
  password_changed_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  client_type TEXT NOT NULL CHECK (client_type IN ('WEB', 'MOBILE')),
  device_name TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at_ms INTEGER NOT NULL,
  last_seen_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER,
  revoked_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_sessions_user_active
  ON sessions(user_id, revoked_at_ms, expires_at_ms);

CREATE TABLE email_verification_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  consumed_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_email_verification_tokens_user
  ON email_verification_tokens(user_id, consumed_at_ms, expires_at_ms);

CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  consumed_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_password_reset_tokens_user
  ON password_reset_tokens(user_id, consumed_at_ms, expires_at_ms);

CREATE TABLE otp_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  created_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  consumed_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_otp_challenges_user_purpose
  ON otp_challenges(user_id, purpose, consumed_at_ms, expires_at_ms);

CREATE TABLE auth_attempt_windows (
  key_hash TEXT PRIMARY KEY NOT NULL,
  attempt_count INTEGER NOT NULL,
  window_started_at_ms INTEGER NOT NULL,
  blocked_until_ms INTEGER,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX idx_auth_attempt_windows_cleanup
  ON auth_attempt_windows(updated_at_ms);

CREATE TABLE permissions (
  code TEXT PRIMARY KEY NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (institution_id, name)
);

CREATE TABLE role_permissions (
  role_id TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_code),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (permission_code) REFERENCES permissions(code) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE user_permission_grants (
  user_id TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  effect TEXT NOT NULL CHECK (effect IN ('ALLOW', 'DENY')),
  reason TEXT,
  created_at_ms INTEGER NOT NULL,
  created_by_user_id TEXT,
  PRIMARY KEY (user_id, permission_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (permission_code) REFERENCES permissions(code) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

INSERT INTO permissions(code, description) VALUES
  ('resident.read', 'Read resident and registration records'),
  ('resident.approve', 'Approve, reject, or request changes to resident registrations'),
  ('resident.edit', 'Edit resident profile data where policy allows'),
  ('auth.sessions.manage', 'Manage user sessions and device access'),
  ('meal.configure', 'Configure institution meal definitions and policy'),
  ('meal.override', 'Override resident meal state with required reason'),
  ('payment.submit', 'Submit payments'),
  ('payment.review', 'Review submitted payments'),
  ('payment.approve', 'Approve payments'),
  ('payment.void', 'Void approved payments through controlled reversal'),
  ('expense.create', 'Create direct expenses'),
  ('expense.approve', 'Approve direct expenses'),
  ('billing.generate', 'Generate bills'),
  ('billing.publish', 'Publish bills'),
  ('billing.close', 'Close billing cycles'),
  ('formula.manage', 'Manage and activate formula versions'),
  ('report.export', 'Export authorized reports'),
  ('settings.manage', 'Manage institution settings and policy configuration'),
  ('audit.read', 'Read immutable audit evidence');
