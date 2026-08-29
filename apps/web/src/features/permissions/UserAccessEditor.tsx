import { useEffect, useMemo, useState } from "react";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import { WebApiError } from "../auth/api";
import {
  permissionApi,
  type AccessUser,
  type PermissionCatalogEntry,
  type PermissionRole,
  type UserAccessResponse,
} from "./api";

interface UserAccessEditorProps {
  users: AccessUser[];
  roles: PermissionRole[];
  catalog: PermissionCatalogEntry[];
  canManage: boolean;
}

export function UserAccessEditor({
  users,
  roles,
  catalog,
  canManage,
}: UserAccessEditorProps) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [access, setAccess] = useState<UserAccessResponse>();
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [roleReason, setRoleReason] = useState("");
  const [overridePermission, setOverridePermission] = useState(
    catalog[0]?.code ?? "",
  );
  const [overrideEffect, setOverrideEffect] = useState<
    "ALLOW" | "DENY" | "INHERIT"
  >("ALLOW");
  const [overrideReason, setOverrideReason] = useState("");
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId],
  );

  async function loadAccess(userId = selectedUserId) {
    if (!userId) return;
    try {
      const next = await permissionApi.userAccess(userId);
      setAccess(next);
      setSelectedRoleIds(new Set(next.roles.map((role) => role.id)));
    } catch (error) {
      setMessage(
        error instanceof WebApiError ? error.message : "Unable to load user access.",
      );
    }
  }

  useEffect(() => {
    if (selectedUserId) void loadAccess(selectedUserId);
  }, [selectedUserId]);

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) => {
      const next = new Set(current);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  async function saveRoles() {
    if (!selectedUserId || roleReason.trim().length < 3) return;
    setBusy(true);
    setMessage(undefined);
    try {
      await permissionApi.replaceUserRoles(
        selectedUserId,
        [...selectedRoleIds],
        roleReason.trim(),
      );
      setRoleReason("");
      await loadAccess();
      setMessage("Role membership updated and audited.");
    } catch (error) {
      setMessage(
        error instanceof WebApiError
          ? error.code === "STEP_UP_REQUIRED"
            ? "Verify step-up security before changing role membership."
            : error.message
          : "Unable to update role membership.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveOverride() {
    if (
      !selectedUserId ||
      !overridePermission ||
      overrideReason.trim().length < 3
    ) {
      return;
    }
    setBusy(true);
    setMessage(undefined);
    try {
      await permissionApi.setUserOverride(
        selectedUserId,
        overridePermission,
        overrideEffect,
        overrideReason.trim(),
      );
      setOverrideReason("");
      await loadAccess();
      setMessage("Direct permission override updated and audited.");
    } catch (error) {
      setMessage(
        error instanceof WebApiError
          ? error.code === "STEP_UP_REQUIRED"
            ? "Verify step-up security before changing direct permissions."
            : error.message
          : "Unable to update the direct permission override.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassSurface className="permission-workspace-card" strength="regular">
      <div className="permission-card-heading">
        <div>
          <span className="section-label">Action authorization</span>
          <h2>User access assignments</h2>
        </div>
        <StatusChip tone={canManage ? "success" : "info"}>
          {canManage ? "Audited changes" : "Read only"}
        </StatusChip>
      </div>

      <div className="permission-user-layout">
        <aside className="permission-user-list">
          {users.map((user) => (
            <button
              className={selectedUserId === user.id ? "is-active" : ""}
              key={user.id}
              type="button"
              onClick={() => {
                setSelectedUserId(user.id);
                setMessage(undefined);
              }}
            >
              <strong>{user.displayName}</strong>
              <span>{user.institutionUserId}</span>
              <small>{user.accountState}</small>
            </button>
          ))}
        </aside>

        <section className="permission-user-editor">
          {selectedUser ? (
            <div className="permission-user-summary">
              <div>
                <strong>{selectedUser.displayName}</strong>
                <span>
                  {selectedUser.institutionUserId} · {selectedUser.email}
                </span>
              </div>
              <StatusChip
                tone={selectedUser.accountState === "ACTIVE" ? "success" : "warning"}
              >
                {selectedUser.accountState}
              </StatusChip>
            </div>
          ) : null}

          {access ? (
            <>
              <div className="permission-summary-strip">
                <span>{access.roles.length} roles</span>
                <span>{access.directGrants.length} direct overrides</span>
                <span>{access.effectivePermissions.length} effective permissions</span>
              </div>

              <div className="permission-section">
                <h3>Role membership</h3>
                <div className="permission-role-membership">
                  {roles.map((role) => (
                    <label key={role.id}>
                      <input
                        checked={selectedRoleIds.has(role.id)}
                        disabled={!canManage}
                        type="checkbox"
                        onChange={() => toggleRole(role.id)}
                      />
                      <span>{role.name}</span>
                    </label>
                  ))}
                </div>
                {canManage ? (
                  <div className="permission-action-row">
                    <input
                      maxLength={500}
                      placeholder="Reason for role membership change"
                      value={roleReason}
                      onChange={(event) => setRoleReason(event.target.value)}
                    />
                    <BoardOpsButton
                      tone="primary"
                      disabled={busy || roleReason.trim().length < 3}
                      onClick={saveRoles}
                    >
                      Save roles
                    </BoardOpsButton>
                  </div>
                ) : null}
              </div>

              <div className="permission-section">
                <h3>Direct override</h3>
                <p>
                  Direct <strong>DENY</strong> wins over inherited roles. Use
                  overrides only for explicit exceptions; use INHERIT to remove an
                  override.
                </p>
                <div className="permission-override-grid">
                  <select
                    disabled={!canManage}
                    value={overridePermission}
                    onChange={(event) => setOverridePermission(event.target.value)}
                  >
                    {catalog.map((permission) => (
                      <option key={permission.code} value={permission.code}>
                        {permission.code}
                      </option>
                    ))}
                  </select>
                  <select
                    disabled={!canManage}
                    value={overrideEffect}
                    onChange={(event) =>
                      setOverrideEffect(
                        event.target.value as "ALLOW" | "DENY" | "INHERIT",
                      )
                    }
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                    <option value="INHERIT">INHERIT</option>
                  </select>
                  <input
                    disabled={!canManage}
                    maxLength={500}
                    placeholder="Mandatory reason"
                    value={overrideReason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                  />
                  <BoardOpsButton
                    disabled={
                      !canManage || busy || overrideReason.trim().length < 3
                    }
                    onClick={saveOverride}
                  >
                    Apply override
                  </BoardOpsButton>
                </div>
                <div className="permission-direct-grants">
                  {access.directGrants.length ? (
                    access.directGrants.map((grant) => (
                      <span data-effect={grant.effect} key={grant.code}>
                        {grant.code} · {grant.effect}
                      </span>
                    ))
                  ) : (
                    <span>No direct overrides</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="permission-helper">Select a user to inspect access.</p>
          )}

          {message ? <p className="permission-helper">{message}</p> : null}
        </section>
      </div>
    </GlassSurface>
  );
}
