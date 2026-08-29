import { useEffect, useMemo, useState } from "react";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import { WebApiError } from "../auth/api";
import {
  permissionApi,
  type PermissionCatalogEntry,
  type PermissionRole,
} from "./api";

interface RoleEditorProps {
  catalog: PermissionCatalogEntry[];
  roles: PermissionRole[];
  canManage: boolean;
  onChanged: () => Promise<void>;
}

export function RoleEditor({
  catalog,
  roles,
  canManage,
  onChanged,
}: RoleEditorProps) {
  const [selectedId, setSelectedId] = useState<string>(roles[0]?.id ?? "new");
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedId),
    [roles, selectedId],
  );
  const creating = selectedId === "new" || !selectedRole;

  useEffect(() => {
    if (creating) {
      setName("");
      setSelectedPermissions(new Set());
      return;
    }
    setName(selectedRole.name);
    setSelectedPermissions(new Set(selectedRole.permissionCodes));
  }, [creating, selectedRole]);

  function togglePermission(code: string) {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function saveRole() {
    if (!canManage || !name.trim()) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const permissionCodes = [...selectedPermissions].sort();
      if (creating) {
        const created = await permissionApi.createRole(name.trim(), permissionCodes);
        setSelectedId(created.role.id);
        setMessage("Role created and audited.");
      } else {
        await permissionApi.updateRole(selectedRole.id, name.trim(), permissionCodes);
        setMessage("Role definition updated and audited.");
      }
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof WebApiError
          ? error.code === "STEP_UP_REQUIRED"
            ? "Verify step-up security before changing role definitions."
            : error.message
          : "Unable to save the role.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassSurface className="permission-workspace-card" strength="regular">
      <div className="permission-card-heading">
        <div>
          <span className="section-label">Role engine</span>
          <h2>Roles and inherited permissions</h2>
        </div>
        <StatusChip tone={canManage ? "success" : "info"}>
          {canManage ? "Manage enabled" : "Read only"}
        </StatusChip>
      </div>

      <div className="permission-role-layout">
        <div className="permission-role-list" aria-label="Institution roles">
          {roles.map((role) => (
            <button
              className={selectedId === role.id ? "is-active" : ""}
              key={role.id}
              type="button"
              onClick={() => setSelectedId(role.id)}
            >
              <span>{role.name}</span>
              <small>{role.permissionCodes.length} permissions</small>
            </button>
          ))}
          {canManage ? (
            <button
              className={selectedId === "new" ? "is-active" : ""}
              type="button"
              onClick={() => setSelectedId("new")}
            >
              <span>+ New custom role</span>
              <small>Start with no permissions</small>
            </button>
          ) : null}
        </div>

        <div className="permission-role-editor">
          <label>
            <span>Role name</span>
            <input
              disabled={!canManage || Boolean(selectedRole?.system)}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          {selectedRole?.system ? (
            <p className="permission-helper">
              System roles are immutable. Their effective permissions remain
              visible for transparency.
            </p>
          ) : null}

          <div className="permission-catalog-grid">
            {catalog.map((permission) => (
              <label className="permission-check" key={permission.code}>
                <input
                  checked={selectedPermissions.has(permission.code)}
                  disabled={!canManage || Boolean(selectedRole?.system)}
                  type="checkbox"
                  onChange={() => togglePermission(permission.code)}
                />
                <span>
                  <strong>{permission.code}</strong>
                  <small>{permission.description}</small>
                </span>
              </label>
            ))}
          </div>

          {canManage && !selectedRole?.system ? (
            <BoardOpsButton
              tone="primary"
              disabled={busy || name.trim().length < 2}
              onClick={saveRole}
            >
              {creating ? "Create role" : "Save role"}
            </BoardOpsButton>
          ) : null}
          {message ? <p className="permission-helper">{message}</p> : null}
        </div>
      </div>
    </GlassSurface>
  );
}
