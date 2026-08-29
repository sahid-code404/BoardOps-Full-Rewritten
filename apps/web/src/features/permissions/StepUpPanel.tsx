import { useState } from "react";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import { authApi, WebApiError } from "../auth/api";

interface StepUpPanelProps {
  onVerified: () => Promise<void> | void;
}

export function StepUpPanel({ onVerified }: StepUpPanelProps) {
  const [challengeId, setChallengeId] = useState<string>();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string>();
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    setBusy(true);
    setMessage(undefined);
    try {
      const challenge = await authApi.requestOtp();
      setChallengeId(challenge.challengeId);
      setCode(challenge.developmentOtpCode ?? "");
      setVerified(false);
      setMessage(
        challenge.developmentOtpCode
          ? "Development code loaded automatically. Verify it to unlock access changes for five minutes."
          : "A verification code was sent. Enter it below.",
      );
    } catch (error) {
      setMessage(
        error instanceof WebApiError
          ? error.message
          : "Unable to request a verification code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!challengeId || code.trim().length !== 6) return;
    setBusy(true);
    setMessage(undefined);
    try {
      await authApi.verifyOtp(challengeId, code.trim());
      setChallengeId(undefined);
      setCode("");
      setVerified(true);
      setMessage("Step-up verified. High-risk access changes are unlocked briefly.");
      await onVerified();
    } catch (error) {
      setMessage(
        error instanceof WebApiError
          ? error.message
          : "Verification could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassSurface className="permission-stepup" strength="soft">
      <div className="permission-card-heading">
        <div>
          <span className="section-label">High-risk authorization</span>
          <h2>Step-up verification</h2>
        </div>
        <StatusChip tone={verified ? "success" : "warning"}>
          {verified ? "Verified" : "Required for changes"}
        </StatusChip>
      </div>
      <p>
        Role membership and direct permission overrides require both
        <code> permissions.manage </code> and recent OTP verification.
      </p>
      <div className="permission-stepup__actions">
        <BoardOpsButton disabled={busy} onClick={requestCode}>
          {challengeId ? "Request new code" : "Request verification code"}
        </BoardOpsButton>
        {challengeId ? (
          <>
            <label className="permission-inline-field">
              <span>6-digit code</span>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/gu, ""))}
              />
            </label>
            <BoardOpsButton
              tone="primary"
              disabled={busy || code.length !== 6}
              onClick={verifyCode}
            >
              Verify
            </BoardOpsButton>
          </>
        ) : null}
      </div>
      {message ? <p className="permission-helper">{message}</p> : null}
    </GlassSurface>
  );
}
