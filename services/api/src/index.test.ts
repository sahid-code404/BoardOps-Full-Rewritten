import { describe, expect, it } from 'vitest';
import { app } from './index';

describe('BoardOps API foundation', () => {
  it('returns a versioned health response', async () => {
    const response = await app.request('/api/v1/health', {}, { BOARDOPS_ENV: 'test' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'ok', service: 'boardops-api', apiVersion: 'v1' });
  });

  it('returns the safe error envelope for unknown routes', async () => {
    const response = await app.request('/missing', {}, { BOARDOPS_ENV: 'test' });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});
