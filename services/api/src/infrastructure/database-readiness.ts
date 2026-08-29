export async function isDatabaseReady(db: D1Database): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return row?.ok === 1;
}

export async function readinessSnapshot(env: CloudflareBindings) {
  let d1 = false;
  try {
    d1 = await isDatabaseReady(env.DB);
  } catch {
    d1 = false;
  }

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
