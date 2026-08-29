import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";

import { BoardOpsButton, GlassSurface } from "../../design";
import { authApi, WebApiError } from "./api";
import { PasswordResetPanel } from "./PasswordResetPanel";

type Mode = "login" | "register" | "reset";

function errorMessage(error: unknown): string {
  return error instanceof WebApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [verificationToken, setVerificationToken] = useState<string>();

  const [institutionSlug, setInstitutionSlug] = useState("demo");
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [institutionUserId, setInstitutionUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [registrationPassword, setRegistrationPassword] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(undefined);
    try {
      await authApi.login({
        institutionSlug,
        identifier,
        password: loginPassword,
      });
      navigate("/account");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(undefined);
    try {
      const result = await authApi.register({
        institutionSlug,
        institutionUserId,
        displayName,
        email,
        password: registrationPassword,
      });
      setVerificationToken(result.developmentVerificationToken);
      setMessage(
        result.developmentVerificationToken
          ? "Registration created. Verify the local development email to continue."
          : "Registration created. Check your email for the verification step.",
      );
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function verifyLocalEmail() {
    if (!verificationToken) return;
    setBusy(true);
    try {
      await authApi.verifyEmail(verificationToken);
      setVerificationToken(undefined);
      setMessage(
        "Email verified. Your registration is now waiting for administrator review.",
      );
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-mesh auth-mesh--one" aria-hidden="true" />
      <div className="auth-mesh auth-mesh--two" aria-hidden="true" />
      <div className="auth-mesh auth-mesh--three" aria-hidden="true" />

      <section className="auth-layout" aria-labelledby="auth-title">
        <GlassSurface className="auth-card" strength="strong">
          <div className="auth-brand">
            <div className="auth-brand__mark" aria-hidden="true">
              ✦
            </div>
            <div>
              <strong>BoardOps</strong>
              <span>Operations Suite</span>
            </div>
          </div>

          {mode !== "reset" ? (
            <div
              className="auth-tabs"
              role="tablist"
              aria-label="Authentication mode"
            >
              <BoardOpsButton
                aria-selected={mode === "login"}
                role="tab"
                tone={mode === "login" ? "primary" : "neutral"}
                onClick={() => setMode("login")}
              >
                Sign in
              </BoardOpsButton>
              <BoardOpsButton
                aria-selected={mode === "register"}
                role="tab"
                tone={mode === "register" ? "primary" : "neutral"}
                onClick={() => setMode("register")}
              >
                Register
              </BoardOpsButton>
            </div>
          ) : null}

          {mode === "login" ? (
            <form className="auth-form" onSubmit={signIn}>
              <div className="auth-form__heading">
                <h1 id="auth-title">Welcome back</h1>
                <p>Sign in to your institution workspace.</p>
              </div>
              <label>
                Institution
                <input
                  autoComplete="organization"
                  value={institutionSlug}
                  onChange={(event) => setInstitutionSlug(event.target.value)}
                  required
                />
              </label>
              <label>
                Email or Institution User ID
                <input
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="current-password"
                  type="password"
                  minLength={12}
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
              </label>
              <BoardOpsButton disabled={busy} tone="primary" type="submit">
                {busy ? "Signing in…" : "Sign in"}
                <span aria-hidden="true">→</span>
              </BoardOpsButton>
              <button
                className="auth-demo-link"
                disabled={busy}
                type="button"
                onClick={() => setMode("reset")}
              >
                Forgot password?
              </button>
            </form>
          ) : mode === "register" ? (
            <form className="auth-form" onSubmit={register}>
              <div className="auth-form__heading">
                <h1 id="auth-title">Create account</h1>
                <p>Register with the identity issued by your institution.</p>
              </div>
              <label>
                Institution
                <input
                  value={institutionSlug}
                  onChange={(event) => setInstitutionSlug(event.target.value)}
                  required
                />
              </label>
              <label>
                Institution User ID
                <input
                  value={institutionUserId}
                  onChange={(event) => setInstitutionUserId(event.target.value)}
                  required
                />
              </label>
              <label>
                Full name
                <input
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  type="password"
                  value={registrationPassword}
                  onChange={(event) =>
                    setRegistrationPassword(event.target.value)
                  }
                  required
                />
              </label>
              <BoardOpsButton disabled={busy} tone="primary" type="submit">
                {busy ? "Creating…" : "Create account"}
                <span aria-hidden="true">→</span>
              </BoardOpsButton>
              {verificationToken ? (
                <BoardOpsButton disabled={busy} onClick={verifyLocalEmail}>
                  Verify local development email
                </BoardOpsButton>
              ) : null}
            </form>
          ) : (
            <PasswordResetPanel
              institutionSlug={institutionSlug}
              identifier={identifier}
              onBack={() => setMode("login")}
            />
          )}

          {message && mode !== "reset" ? (
            <p className="auth-message" role="status">
              {message}
            </p>
          ) : null}
        </GlassSurface>
      </section>
    </main>
  );
}
