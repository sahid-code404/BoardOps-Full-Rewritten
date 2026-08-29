import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import { authApi, type MeResponse, WebApiError } from "../auth/api";
import {
  permissionApi,
  type AccessUser,
  type PermissionCatalogEntry,
  type PermissionRole,
} from "./api";
import { RoleEditor } from "./RoleEditor";
import { StepUpPanel } from "./StepUpPanel";
import { UserAccessEditor } from "./UserAccessEditor";

export function PermissionsPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse>();
  const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([]);
  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(true);

  async function loadIdentity() {
    try {
      const current = await authApi.me();
      setMe(current);
      return current;
    } catch (error) {
      if (error instanceof WebApiError && error.status === 401) {
        navigate("/auth", { replace: true });
        return undefined;
      }
      setMessage(
        error instanceof WebApiError
          ? error.message
          : "Unable to load the authenticated account.",
      );
      return undefined;
    }
  }

  async function loadWorkspace(current = me) {
    if (!current?.user.permissions.includes("permissions.read")) return;
    try {
      const [catalogResponse, roleResponse, userResponse] = await Promise.all([
        permissionApi.catalog(),
        permissionApi.roles(),
        permissionApi.users(),
      ]);
      setCatalog(catalogResponse.permissions);
      setRoles(roleResponse.roles);
      setUsers(userResponse.users);
    } catch (error) {
      setMessage(
        error instanceof WebApiError
          ? error.message
          : "Unable to load permission administration.",
      );
    }
  }

  useEffect(() => {
    void (async () => {
      const current = await loadIdentity();
      if (current) await loadWorkspace(current);
      setLoading(false);
    })();
  }, []);

  if (loading || !me) {
    return (
      <main className="auth-page permissions-page">
        <GlassSurface className="account-loading">
          Loading access control…
        </GlassSurface>
      </main>
    );
  }

  const canRead = me.user.permissions.includes("permissions.read");
  const canManage = me.user.permissions.includes("permissions.manage");

  return (
    <main className="auth-page permissions-page">
      <div className="auth-mesh auth-mesh--one" aria-hidden="true" />
      <div className="auth-mesh auth-mesh--two" aria-hidden="true" />
      <div className="auth-mesh auth-mesh--three" aria-hidden="true" />
      <section className="permissions-shell">
        <header className="permission-page-header">
          <div>
            <span className="section-label">Admin Console</span>
            <h1>Access Control</h1>
            <p>
              Manage institution roles, permissions, and individual access from
              one workspace.
            </p>
          </div>
          <div className="account-header__actions">
            <StatusChip tone={canManage ? "success" : "info"}>
              {canManage ? "Permission manager" : "Permission reader"}
            </StatusChip>
            <BoardOpsButton onClick={() => navigate("/account")}>Account</BoardOpsButton>
          </div>
        </header>

        {!canRead ? (
          <GlassSurface className="permission-denied" strength="strong">
            <StatusChip tone="danger">Access denied</StatusChip>
            <h2>Access control is unavailable</h2>
            <p>
              Your account does not have permission to view this workspace.
            </p>
          </GlassSurface>
        ) : (
          <>
            <div className="permission-kpis">
              <GlassSurface className="permission-kpi" strength="soft">
                <span>Permissions</span>
                <strong>{catalog.length}</strong>
                <small>available actions</small>
              </GlassSurface>
              <GlassSurface className="permission-kpi" strength="soft">
                <span>Roles</span>
                <strong>{roles.length}</strong>
                <small>institution roles</small>
              </GlassSurface>
              <GlassSurface className="permission-kpi" strength="soft">
                <span>Users</span>
                <strong>{users.length}</strong>
                <small>access identities</small>
              </GlassSurface>
            </div>

            {canManage ? (
              <StepUpPanel
                onVerified={async () => {
                  const current = await loadIdentity();
                  if (current) await loadWorkspace(current);
                }}
              />
            ) : null}

            <RoleEditor
              catalog={catalog}
              roles={roles}
              canManage={canManage}
              onChanged={async () => {
                const next = await permissionApi.roles();
                setRoles(next.roles);
              }}
            />

            <UserAccessEditor
              catalog={catalog}
              roles={roles}
              users={users}
              canManage={canManage}
            />
          </>
        )}

        {message ? (
          <p className="auth-message" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
