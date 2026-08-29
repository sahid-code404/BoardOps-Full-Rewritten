PRAGMA foreign_keys = ON;

CREATE TABLE institutions (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE TABLE idempotency_records (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT,
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  state TEXT NOT NULL,
  response_status INTEGER,
  response_body_json TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (scope, idempotency_key)
);

CREATE INDEX idx_idempotency_records_expiry
  ON idempotency_records(expires_at_ms);
CREATE INDEX idx_idempotency_records_institution
  ON idempotency_records(institution_id, created_at_ms);

CREATE TABLE outbox_events (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT,
  event_type TEXT NOT NULL,
  aggregate_type TEXT,
  aggregate_id TEXT,
  payload_json TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  available_at_ms INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL,
  dispatched_at_ms INTEGER,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_outbox_events_dispatch
  ON outbox_events(state, available_at_ms, created_at_ms);
CREATE INDEX idx_outbox_events_aggregate
  ON outbox_events(institution_id, aggregate_type, aggregate_id, created_at_ms);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT,
  actor_ref TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  reason TEXT,
  metadata_json TEXT,
  correlation_id TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_audit_events_entity
  ON audit_events(institution_id, entity_type, entity_id, created_at_ms);
CREATE INDEX idx_audit_events_correlation
  ON audit_events(correlation_id, created_at_ms);

CREATE TRIGGER audit_events_no_update
BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events are append-only');
END;

CREATE TRIGGER audit_events_no_delete
BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events are append-only');
END;

CREATE TABLE background_tasks (
  id TEXT PRIMARY KEY NOT NULL,
  institution_id TEXT,
  task_type TEXT NOT NULL,
  state TEXT NOT NULL,
  operation_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  completed_at_ms INTEGER,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX idx_background_tasks_state
  ON background_tasks(state, updated_at_ms);
CREATE INDEX idx_background_tasks_institution
  ON background_tasks(institution_id, task_type, created_at_ms);
