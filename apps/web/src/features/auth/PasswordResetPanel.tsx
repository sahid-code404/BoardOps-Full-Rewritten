import { useState } from "react";
import type { FormEvent } from "react";

import { BoardOpsButton } from "../../design";
import { authApi, WebApiError } from "./api";

interface PasswordResetPanelProps {
  institutionSlug: string;
  identifier: string;
  onBack: () => void;
}

function messageForError(error: unknown): string {
  return error instanceof WebApiError
    ? error.message
    : "Password reset could not be completed.";
}

export function PasswordResetPanel({
  institutionSlug,
  identifier,
  onBack,
}: PasswordResetPanelProps) {
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(undefined);
    try {
      const result = await authApi.requestPasswordReset({
        institutionSlug,
        identifier,
      });
      setResetToken(result.developmentResetToken ?? "");
      setRequested(true);
      setMessage(
        "If the account exists, password-reset instructions have been issued.",
      );
    } catch (error) {
      setMessage(messageForError(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(undefined);
    try {
      await authApi.confirmPasswordReset(resetToken, newPassword);
      setMessage("Password changed. Existing sessions were revoked.");
      setRequested(false);
      setResetToken("");
      setNewPassword("");
    } catch (error) {
      setMessage(messageForError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-reset-panel">
      <div className="auth-form__heading">
        <span className="section-label">Account recovery</span>
        <h2>{requested ? "Choose a new password" : "Reset your password"}</h2>
      </div>
      {requested ? (
        <form className="auth-form" onSubmit={confirmReset}>
          <label>
            Reset token
            <input
              autoComplete="one-time-code"
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
              required
            />
          </label>
          <label>
            New password
            <input
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <BoardOpsButton disabled={busy} tone="primary" type="submit">
            {busy ? "Changing…" : "Change password"}
          </BoardOpsButton>
        </form>
      ) : (
        <form className="auth-form" onSubmit={requestReset}>
          <p className="empty-copy">
            Reset instructions will be sent for the current institution and
            identity without revealing whether an account exists.
          </p>
          <BoardOpsButton disabled={busy} tone="primary" type="submit">
            {busy ? "Requesting…" : "Send reset instructions"}
          </BoardOpsButton>
        </form>
      )}
      <button className="auth-demo-link" type="button" onClick={onBack}>
        Back to sign in
      </button>
      {message ? (
        <p className="auth-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
