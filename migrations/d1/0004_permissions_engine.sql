PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO permissions(code, description) VALUES
  ('permissions.read', 'Read institution roles, permission catalog, and user access summaries'),
  ('permissions.manage', 'Create and manage roles, role membership, and explicit user permission overrides');

CREATE INDEX IF NOT EXISTS idx_roles_institution_name
  ON roles(institution_id, name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission
  ON role_permissions(permission_code, role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON user_roles(role_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_permission_grants_permission
  ON user_permission_grants(permission_code, effect, user_id);
