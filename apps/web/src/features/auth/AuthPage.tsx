import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import { authApi, WebApiError } from "./api";

type Mode = "login" | "register";

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
  const [identifier, setIdentifier] = useState("admin@boardops.local");
  const [loginPassword, setLoginPassword] = useState("BoardOpsLocal#2026");

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

  async function createLocalDemo() {
    setBusy(true);
    setMessage(undefined);
    try {
      const demo = await authApi.bootstrapDemo();
      setInstitutionSlug(demo.institutionSlug);
      setIdentifier(demo.identifier);
      setLoginPassword(demo.password);
      await authApi.login({
        institutionSlug: demo.institutionSlug,
        identifier: demo.identifier,
        password: demo.password,
      });
      navigate("/account");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <section className="auth-layout" aria-labelledby="auth-title">
        <div className="auth-intro">
          <StatusChip>PHASE 04</StatusChip>
          <h1 id="auth-title">
            Secure access, without the admin-template feel.
          </h1>
          <p>
            BoardOps now has institution-scoped identity, verification, review
            states, secure sessions, permission-aware access, and device
            revocation foundations.
          </p>
          <div
            className="auth-principles"
            aria-label="Authentication principles"
          >
            <span>Institution User ID</span>
            <span>HttpOnly web session</span>
            <span>Permission-based authorization</span>
            <span>Audited lifecycle</span>
          </div>
        </div>

        <GlassSurface className="auth-card" strength="strong">
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

          {mode === "login" ? (
            <form className="auth-form" onSubmit={signIn}>
              <div className="auth-form__heading">
                <span className="section-label">Welcome back</span>
                <h2>Sign in to BoardOps</h2>
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
              </BoardOpsButton>
              <button
                className="auth-demo-link"
                disabled={busy}
                type="button"
                onClick={createLocalDemo}
              >
                Create / refresh local demo administrator
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={register}>
              <div className="auth-form__heading">
                <span className="section-label">Institution registration</span>
                <h2>Create your account</h2>
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
              </BoardOpsButton>
              {verificationToken ? (
                <BoardOpsButton disabled={busy} onClick={verifyLocalEmail}>
                  Verify local development email
                </BoardOpsButton>
              ) : null}
            </form>
          )}

          {message ? (
            <p className="auth-message" role="status">
              {message}
            </p>
          ) : null}
        </GlassSurface>
      </section>
    </main>
  );
}
