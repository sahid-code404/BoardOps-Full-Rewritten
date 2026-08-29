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
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        `${options.method ?? "GET"} ${path} returned non-JSON ${response.status}: ${text}`,
      );
    }
  }
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

async function stepUp(cookie) {
  const challenge = await request("/auth/otp/request", {
    method: "POST",
    cookie,
    body: { purpose: "STEP_UP" },
  });
  assert(challenge.payload.developmentOtpCode, "Local OTP code missing.");
  await request("/auth/otp/verify", {
    method: "POST",
    cookie,
    body: {
      challengeId: challenge.payload.challengeId,
      code: challenge.payload.developmentOtpCode,
    },
  });
}

console.log("BoardOps permissions smoke: bootstrap administrator");
const bootstrap = await request("/dev/bootstrap", { method: "POST", body: {} });
const demo = bootstrap.payload;
const adminLogin = await request("/auth/login", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    identifier: demo.identifier,
    password: demo.password,
    clientType: "WEB",
    deviceName: "Permissions smoke administrator",
  },
});
const adminCookie = cookieFrom(adminLogin.response);
await stepUp(adminCookie);

const catalog = await request("/permissions/catalog", { cookie: adminCookie });
assert(
  catalog.payload.permissions.some((entry) => entry.code === "permissions.read"),
  "permissions.read is missing from the catalog.",
);
assert(
  catalog.payload.permissions.some((entry) => entry.code === "permissions.manage"),
  "permissions.manage is missing from the catalog.",
);

console.log("BoardOps permissions smoke: create active resident and custom role");
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const institutionUserId = `permission-smoke-${suffix}`;
const email = `${institutionUserId}@boardops.local`;
const password = "PermissionSmoke#2026";
const registration = await request("/auth/register", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    institutionUserId,
    displayName: "Permission Smoke Resident",
    email,
    password,
  },
});
await request("/auth/verify-email", {
  method: "POST",
  body: { token: registration.payload.developmentVerificationToken },
});
await request(`/auth/registrations/${registration.payload.userId}/review`, {
  method: "POST",
  cookie: adminCookie,
  body: { action: "APPROVE" },
});

const role = await request("/permissions/roles", {
  method: "POST",
  cookie: adminCookie,
  body: {
    name: `Permission Smoke Viewer ${suffix}`,
    permissionCodes: ["permissions.read", "resident.read"],
  },
});
assert(role.payload.role?.id, "Custom role was not created.");
await request(`/permissions/users/${registration.payload.userId}/roles`, {
  method: "PUT",
  cookie: adminCookie,
  body: {
    roleIds: [role.payload.role.id],
    reason: "Phase 05 permission smoke role assignment",
  },
});

const residentLogin = await request("/auth/login", {
  method: "POST",
  body: {
    institutionSlug: demo.institutionSlug,
    identifier: institutionUserId,
    password,
    clientType: "WEB",
    deviceName: "Permissions smoke resident",
  },
});
const residentCookie = cookieFrom(residentLogin.response);
const residentAccess = await request("/permissions/me", { cookie: residentCookie });
assert(
  residentAccess.payload.effectivePermissions.includes("permissions.read"),
  "Role permission did not resolve for resident.",
);
assert(
  residentAccess.payload.effectivePermissions.includes("resident.read"),
  "Resident read permission did not resolve from role.",
);
await request("/permissions/catalog", { cookie: residentCookie });

const deniedCreate = await request("/permissions/roles", {
  method: "POST",
  cookie: residentCookie,
  expectStatus: 403,
  body: { name: `Denied ${suffix}`, permissionCodes: [] },
});
assert(
  deniedCreate.payload.error?.code === "PERMISSION_DENIED",
  "Missing manage permission did not fail closed.",
);

console.log("BoardOps permissions smoke: direct deny precedence");
await request(
  `/permissions/users/${registration.payload.userId}/grants/permissions.read`,
  {
    method: "PUT",
    cookie: adminCookie,
    body: {
      effect: "DENY",
      reason: "Verify that direct deny overrides inherited role permission",
    },
  },
);
const deniedCatalog = await request("/permissions/catalog", {
  cookie: residentCookie,
  expectStatus: 403,
});
assert(
  deniedCatalog.payload.error?.code === "PERMISSION_DENIED",
  "Direct deny did not override the inherited role permission.",
);

console.log("BoardOps permissions smoke: direct allow plus step-up authorization");
await request(
  `/permissions/users/${registration.payload.userId}/grants/permissions.manage`,
  {
    method: "PUT",
    cookie: adminCookie,
    body: {
      effect: "ALLOW",
      reason: "Verify explicit allow and high-risk step-up enforcement",
    },
  },
);
const stepUpRequired = await request("/permissions/roles", {
  method: "POST",
  cookie: residentCookie,
  expectStatus: 403,
  body: { name: `Needs Step Up ${suffix}`, permissionCodes: [] },
});
assert(
  stepUpRequired.payload.error?.code === "STEP_UP_REQUIRED",
  "High-risk permission mutation did not require step-up verification.",
);
await stepUp(residentCookie);
await request("/permissions/roles", {
  method: "POST",
  cookie: residentCookie,
  body: { name: `Delegated Role ${suffix}`, permissionCodes: [] },
});

console.log("BoardOps permissions smoke: self-lockout prevention");
const adminMe = await request("/auth/me", { cookie: adminCookie });
const selfLockout = await request(
  `/permissions/users/${adminMe.payload.user.id}/roles`,
  {
    method: "PUT",
    cookie: adminCookie,
    expectStatus: 409,
    body: {
      roleIds: [],
      reason: "Verify permission management self-lockout protection",
    },
  },
);
assert(
  selfLockout.payload.error?.code === "SELF_LOCKOUT_PREVENTED",
  "Self-lockout protection did not trigger.",
);

console.log("BoardOps permissions smoke: PASS");
