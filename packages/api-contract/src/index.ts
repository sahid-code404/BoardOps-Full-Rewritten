export type ApiError = {
  error: { code: string; message: string; requestId: string; details?: unknown };
};

export type HealthResponse = {
  status: 'ok';
  service: 'boardops-api';
  apiVersion: 'v1';
  requestId: string;
};
