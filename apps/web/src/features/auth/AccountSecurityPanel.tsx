import { useEffect, useState } from "react";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import {
  authApi,
  type DeviceSession,
  type MeResponse,
  WebApiError,
} from "./api";

interface AccountSecurityPanelProps {
  me: MeResponse;
  onCurrentSessionRevoked: () => void;
  onSessionChanged: () => Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof WebApiError
    ? error.message
    : "The security operation could not be completed.";
}

function shortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function AccountSecurityPanel({
  me,
  onCurrentSessionRevoked,
  onSessionChanged,
}: AccountSecurityPanelProps) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [challengeId, setChallengeId] = useState<string>();
  const [otpCode, setOtpCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  async function refreshSessions() {
    const result = await authApi.sessions();
    setSessions(result.sessions);
  }

  useEffect(() => {
    void refreshSessions().catch((error: unknown) =>
      setMessage(errorMessage(error)),
    );
  }, []);

  async function requestOtp() {
    setBusy(true);
    setMessage(undefined);
    try {
      const result = await authApi.requestOtp();
      setChallengeId(result.challengeId);
      setOtpCode(result.developmentOtpCode ?? "");
      setMessage("A one-time code was issued and expires in five minutes.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!challengeId || !otpCode) return;
    setBusy(true);
    setMessage(undefined);
    try {
      await authApi.verifyOtp(challengeId, otpCode);
      setChallengeId(undefined);
      setOtpCode("");
      await Promise.all([refreshSessions(), onSessionChanged()]);
      setMessage("Step-up verification completed for this session.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(sessionId: string) {
    setBusy(true);
    setMessage(undefined);
    try {
      await authApi.revokeSession(sessionId);
      if (sessionId === me.session.id) {
        onCurrentSessionRevoked();
        return;
      }
      await refreshSessions();
      setMessage("Session revoked.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassSurface className="security-card" strength="strong">
      <div className="security-card__header">
        <div>
          <span className="section-label">Session security</span>
          <h2>Devices, revocation, and step-up verification</h2>
        </div>
        <StatusChip tone={me.session.stepUpVerifiedAtMs ? "success" : "info"}>
          {me.session.stepUpVerifiedAtMs
            ? "STEP-UP VERIFIED"
            : "SESSION ACTIVE"}
        </StatusChip>
      </div>
      <p className="empty-copy">
        Web authentication uses an HttpOnly cookie. Sensitive future actions can
        require a short-lived one-time-code step-up without exposing the session
        secret to JavaScript.
      </p>

      <div className="security-actions">
        {challengeId ? (
          <>
            <label className="security-code-field">
              6-digit verification code
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
              />
            </label>
            <BoardOpsButton
              disabled={busy || otpCode.length !== 6}
              tone="primary"
              onClick={verifyOtp}
            >
              Verify code
            </BoardOpsButton>
          </>
        ) : (
          <BoardOpsButton
            disabled={busy || me.user.accountState !== "ACTIVE"}
            tone="primary"
            onClick={requestOtp}
          >
            Request one-time code
          </BoardOpsButton>
        )}
        <BoardOpsButton disabled={busy} onClick={() => void refreshSessions()}>
          Refresh sessions
        </BoardOpsButton>
      </div>

      <div className="security-session-list">
        {sessions.length ? (
          sessions.map((session) => (
            <article className="security-session" key={session.id}>
              <div>
                <strong>{session.device_name || session.client_type}</strong>
                <span>
                  {session.id === me.session.id ? "Current session · " : ""}
                  Last active {shortDate(session.last_seen_at_ms)}
                </span>
              </div>
              {session.revoked_at_ms ? (
                <StatusChip tone="danger">REVOKED</StatusChip>
              ) : (
                <BoardOpsButton
                  disabled={busy}
                  onClick={() => revoke(session.id)}
                >
                  Revoke
                </BoardOpsButton>
              )}
            </article>
          ))
        ) : (
          <p className="empty-copy">No sessions are available.</p>
        )}
      </div>

      {message ? (
        <p className="auth-message" role="status">
          {message}
        </p>
      ) : null}
    </GlassSurface>
  );
}
