PRAGMA foreign_keys = ON;

ALTER TABLE sessions
  ADD COLUMN step_up_verified_at_ms INTEGER;

CREATE INDEX idx_sessions_user_step_up
  ON sessions(user_id, step_up_verified_at_ms);
