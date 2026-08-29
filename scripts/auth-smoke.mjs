const baseUrl =
  process.env.BOARDOPS_SMOKE_BASE_URL ?? "http://127.0.0.1:8787/api/v1";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cookieFrom(response) {
  const value = response.headers.get("set-cookie");
  if (!value) throw new Error("Expected a web session cookie.");
  return value.split(";", 1)[0];
}

async function request(path, options = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.token) headers.set("authorization", `Bearer ${options.token}`);

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (options.expectStatus !== undefined) {
    assert(
      response.status === options.expectStatus,
      `${options.method ?? "GET"} ${path} expected ${options.expectStatus}, got ${response.status}: ${text}`,
    );
  } else if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} failed with ${response.status}: ${text}`,
    );
  }
  return { response, payload };
}

console.log("BoardOps authentication smoke: bootstrap local administrator");
const bootstrap = await request("/dev/bootstrap", {
  method: "POST",
  body: {},
});
const demo = bootstrap.payload;
assert(
  demo.institutionSlug && demo.identifier && demo.password,
  "Demo bootstrap is incomplete.",
);

const adminLogin = await request("/auth/login", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    identifier: demo.identifier,
    password: demo.password,
    clientType: "WEB",
    deviceName: "CI smoke browser",
  },
});
const adminCookie = cookieFrom(adminLogin.response);

const adminMe = await request("/auth/me", { cookie: adminCookie });
assert(
  adminMe.payload.user.accountState === "ACTIVE",
  "Demo administrator must be active.",
);
assert(
  adminMe.payload.user.permissions.includes("resident.approve"),
  "Demo administrator must be able to review registrations.",
);

console.log("BoardOps authentication smoke: OTP step-up and replay prevention");
const otpRequest = await request("/auth/otp/request", {
  method: "POST",
  cookie: adminCookie,
  body: { purpose: "STEP_UP" },
});
assert(otpRequest.payload.challengeId, "OTP challenge ID missing.");
assert(otpRequest.payload.developmentOtpCode, "Local OTP code missing.");
await request("/auth/otp/verify", {
  method: "POST",
  cookie: adminCookie,
  body: {
    challengeId: otpRequest.payload.challengeId,
    code: otpRequest.payload.developmentOtpCode,
  },
});
await request("/auth/otp/verify", {
  method: "POST",
  cookie: adminCookie,
  expectStatus: 422,
  body: {
    challengeId: otpRequest.payload.challengeId,
    code: otpRequest.payload.developmentOtpCode,
  },
});
const steppedUp = await request("/auth/me", { cookie: adminCookie });
assert(
  Number.isInteger(steppedUp.payload.session.stepUpVerifiedAtMs),
  "Step-up verification timestamp missing.",
);

console.log(
  "BoardOps authentication smoke: registration, verification, and approval",
);
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const institutionUserId = `smoke-${suffix}`;
const email = `${institutionUserId}@boardops.local`;
const firstPassword = "ResidentSmoke#2026";
const secondPassword = "ResidentSmokeReset#2026";
const registration = await request("/auth/register", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    institutionUserId,
    displayName: "Authentication Smoke Resident",
    email,
    password: firstPassword,
  },
});
assert(registration.payload.userId, "Registration user ID missing.");
assert(
  registration.payload.developmentVerificationToken,
  "Local email verification token missing.",
);
await request("/auth/verify-email", {
  method: "POST",
  body: { token: registration.payload.developmentVerificationToken },
});
const pending = await request("/auth/registrations", { cookie: adminCookie });
assert(
  pending.payload.registrations.some(
    (entry) => entry.id === registration.payload.userId,
  ),
  "Verified registration was not visible for review.",
);
await request(`/auth/registrations/${registration.payload.userId}/review`, {
  method: "POST",
  cookie: adminCookie,
  body: { action: "APPROVE" },
});

const residentLogin = await request("/auth/login", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    identifier: institutionUserId,
    password: firstPassword,
    clientType: "WEB",
    deviceName: "CI smoke resident",
  },
});
let residentCookie = cookieFrom(residentLogin.response);
const residentMe = await request("/auth/me", { cookie: residentCookie });
assert(
  residentMe.payload.user.accountState === "ACTIVE",
  "Approved resident must be active.",
);

console.log("BoardOps authentication smoke: password reset and revocation");
const resetRequest = await request("/auth/password-reset/request", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    identifier: institutionUserId,
  },
});
assert(
  resetRequest.payload.developmentResetToken,
  "Local password reset token missing.",
);
await request("/auth/password-reset/confirm", {
  method: "POST",
  body: {
    token: resetRequest.payload.developmentResetToken,
    newPassword: secondPassword,
  },
});
await request("/auth/me", { cookie: residentCookie, expectStatus: 401 });

const residentRelogin = await request("/auth/login", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    identifier: institutionUserId,
    password: secondPassword,
    clientType: "WEB",
    deviceName: "CI smoke resident reset",
  },
});
residentCookie = cookieFrom(residentRelogin.response);
const residentAfterReset = await request("/auth/me", {
  cookie: residentCookie,
});
const residentSessionId = residentAfterReset.payload.session.id;
assert(residentSessionId, "Resident session ID missing after password reset.");

const residentSessions = await request("/auth/sessions", {
  cookie: residentCookie,
});
assert(
  residentSessions.payload.sessions.some(
    (entry) => entry.id === residentSessionId,
  ),
  "Current resident session not listed.",
);
await request(`/auth/sessions/${residentSessionId}`, {
  method: "DELETE",
  cookie: residentCookie,
});
await request("/auth/me", { cookie: residentCookie, expectStatus: 401 });

console.log("BoardOps authentication smoke: PASS");
