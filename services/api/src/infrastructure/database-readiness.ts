export async function isDatabaseReady(db: D1Database): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return row?.ok === 1;
}

async function safeDatabaseReadiness(db: D1Database): Promise<boolean> {
  try {
    return await isDatabaseReady(db);
  } catch {
    return false;
  }
}

export async function readinessSnapshot(env: CloudflareBindings) {
  const d1 = await safeDatabaseReadiness(env.DB);

  return {
    ready:
      d1 &&
      Boolean(env.FILES) &&
      Boolean(env.EVENT_QUEUE) &&
      Boolean(env.FOUNDATION_WORKFLOW),
    resources: {
      d1,
      r2: Boolean(env.FILES),
      queue: Boolean(env.EVENT_QUEUE),
      workflow: Boolean(env.FOUNDATION_WORKFLOW),
    },
  };
}
