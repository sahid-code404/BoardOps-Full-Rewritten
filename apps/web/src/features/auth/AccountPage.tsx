import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import { authApi, type MeResponse, WebApiError } from "./api";

type Registration = Record<string, unknown> & {
  id?: string;
  institution_user_id?: string;
  email?: string;
  display_name?: string;
  account_state?: string;
};

function messageForError(error: unknown): string {
  return error instanceof WebApiError ? error.message : "Unable to load account data.";
}

export function AccountPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [message, setMessage] = useState<string>();
  const [busyId, setBusyId] = useState<string>();

  async function refresh() {
    try {
      const current = await authApi.me();
      setMe(current);
      if (current.user.permissions.includes("resident.approve")) {
        const pending = await authApi.registrations();
        setRegistrations(pending.registrations as Registration[]);
      }
    } catch (error) {
      if (error instanceof WebApiError && error.status === 401) {
        navigate("/auth", { replace: true });
        return;
      }
      setMessage(messageForError(error));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function logout() {
    await authApi.logout();
    navigate("/auth", { replace: true });
  }

  async function review(
    registration: Registration,
    action: "APPROVE" | "REJECT" | "REQUEST_CHANGES",
  ) {
    if (!registration.id) return;
    const reason =
      action === "APPROVE"
        ? undefined
        : window.prompt(
            action === "REJECT"
              ? "Reason for rejection"
              : "What changes are required?",
          )?.trim();
    if (action !== "APPROVE" && !reason) return;

    setBusyId(registration.id);
    setMessage(undefined);
    try {
      await authApi.reviewRegistration(registration.id, action, reason);
      await refresh();
      setMessage(`Registration ${action.toLowerCase().replace("_", " ")}.`);
    } catch (error) {
      setMessage(messageForError(error));
    } finally {
      setBusyId(undefined);
    }
  }

  if (!me) {
    return (
      <main className="auth-page">
        <GlassSurface className="account-loading">Loading secure account…</GlassSurface>
      </main>
    );
  }

  const active = me.user.accountState === "ACTIVE";

  return (
    <main className="auth-page account-page">
      <div className="ambient ambient--one" aria-hidden="true" />
      <section className="account-shell">
        <header className="account-header">
          <div>
            <span className="section-label">Authenticated account</span>
            <h1>{me.user.displayName}</h1>
            <p>
              {me.user.institutionUserId} · {me.user.email}
            </p>
          </div>
          <div className="account-header__actions">
            <StatusChip tone={active ? "success" : "warning"}>
              {me.user.accountState}
            </StatusChip>
            <BoardOpsButton onClick={logout}>Sign out</BoardOpsButton>
          </div>
        </header>

        <div className="account-grid">
          <GlassSurface className="showcase-card" strength="strong">
            <span className="section-label">Session</span>
            <h2>Secure web session active</h2>
            <p>
              The browser uses an HttpOnly session cookie. Session ID {me.session.id.slice(0, 8)}…
              can be revoked without changing your password.
            </p>
            <div className="permission-cloud">
              {me.user.permissions.length ? (
                me.user.permissions.map((permission) => (
                  <span key={permission}>{permission}</span>
                ))
              ) : (
                <span>No active business permissions</span>
              )}
            </div>
          </GlassSurface>

          <GlassSurface className="showcase-card">
            <span className="section-label">Account lifecycle</span>
            <h2>{active ? "Ready for authorized work" : "Limited while review is incomplete"}</h2>
            <p>
              Authentication and authorization are separate. Signing in proves identity;
              permissions and account state decide what the backend allows.
            </p>
          </GlassSurface>
        </div>

        {me.user.permissions.includes("resident.approve") ? (
          <GlassSurface className="review-card" strength="regular">
            <div className="review-card__header">
              <div>
                <span className="section-label">Registration review</span>
                <h2>Pending institution accounts</h2>
              </div>
              <StatusChip tone={registrations.length ? "warning" : "success"}>
                {registrations.length} pending
              </StatusChip>
            </div>

            {registrations.length ? (
              <div className="registration-list">
                {registrations.map((registration) => (
                  <article className="registration-row" key={registration.id}>
                    <div>
                      <strong>{registration.display_name ?? "Unnamed resident"}</strong>
                      <span>
                        {registration.institution_user_id} · {registration.email}
                      </span>
                    </div>
                    <div className="registration-row__actions">
                      <BoardOpsButton
                        disabled={busyId === registration.id}
                        tone="primary"
                        onClick={() => review(registration, "APPROVE")}
                      >
                        Approve
                      </BoardOpsButton>
                      <BoardOpsButton
                        disabled={busyId === registration.id}
                        onClick={() => review(registration, "REQUEST_CHANGES")}
                      >
                        Request changes
                      </BoardOpsButton>
                      <BoardOpsButton
                        disabled={busyId === registration.id}
                        onClick={() => review(registration, "REJECT")}
                      >
                        Reject
                      </BoardOpsButton>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No registrations need review right now.</p>
            )}
          </GlassSurface>
        ) : null}

        {message ? <p className="auth-message" role="status">{message}</p> : null}
      </section>
    </main>
  );
}
