import { test, expect, request as pwRequest } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = process.env.RHOMBUS_BASE_URL ?? 'https://rhombusai.com';
const USER_EMAIL = process.env.RHOMBUS_EMAIL;
const USER_PASSWORD = process.env.RHOMBUS_PASSWORD;

async function createApiClient() {
  const apiRequestContext = await pwRequest.newContext({
    baseURL: BASE_URL,
  });
  return apiRequestContext;
}

test.describe('API – Auth, upload and pipeline', () => {
  test('Authentication returns a usable token @smoke @api', async () => {
    test.skip(!USER_EMAIL || !USER_PASSWORD, 'RHOMBUS_EMAIL and RHOMBUS_PASSWORD must be set');

    const api = await createApiClient();

    // Adjust endpoint to match real Rhombus auth API
    const response = await api.post('/api/auth/login', {
      data: {
        email: USER_EMAIL,
        password: USER_PASSWORD,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
  });

  test('Uploading invalid dataset returns a clear error @api', async () => {
    const api = await createApiClient();

    // Intentionally invalid upload (no file or wrong format)
    const response = await api.post('/api/datasets', {
      multipart: {
        // no "file" part
      },
    });

    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('Upload dataset and check pipeline status lifecycle @api', async () => {
    test.skip(!USER_EMAIL || !USER_PASSWORD, 'RHOMBUS_EMAIL and RHOMBUS_PASSWORD must be set');

    const api = await createApiClient();

    // 1. Authenticate
    const authRes = await api.post('/api/auth/login', {
      data: { email: USER_EMAIL, password: USER_PASSWORD },
    });
    expect(authRes.status()).toBe(200);
    const authBody = await authRes.json();
    const token = authBody.token as string;
    expect(token).toBeTruthy();

    const authedApi = await pwRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 2. Upload dataset
    const fileBuffer = fs.readFileSync('data/fifa21_raw_data.csv');

    const uploadRes = await authedApi.post('/api/datasets', {
      multipart: {
        file: {
          name: 'fifa21_raw_data.csv',
          mimeType: 'text/csv',
          buffer: fileBuffer,
        },
      },
    });

    expect(uploadRes.status()).toBe(201);
    const uploadBody = await uploadRes.json();
    const datasetId = uploadBody.id;
    expect(datasetId).toBeTruthy();

    // 3. Create AI pipeline
    const pipelineRes = await authedApi.post('/api/pipelines', {
      data: {
        datasetId,
        mode: 'ai',
        prompt: 'Clean this dataset deterministically for testing.',
      },
    });

    expect(pipelineRes.status()).toBe(201);
    const pipelineBody = await pipelineRes.json();
    const pipelineId = pipelineBody.id;
    expect(pipelineId).toBeTruthy();

    // 4. Poll status
    let status = 'pending';
    const started = Date.now();
    const timeoutMs = 240000;

    while (Date.now() - started < timeoutMs) {
      const statusRes = await authedApi.get(`/api/pipelines/${pipelineId}/status`);
      expect(statusRes.ok()).toBeTruthy();
      const statusBody = await statusRes.json();
      status = statusBody.status;
      if (status === 'completed' || status === 'failed') break;
      await new Promise((r) => setTimeout(r, 5000));
    }

    expect(['completed', 'failed']).toContain(status);
  });
});
