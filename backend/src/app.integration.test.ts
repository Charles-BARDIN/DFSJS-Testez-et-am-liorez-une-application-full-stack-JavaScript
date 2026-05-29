import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

describe('GET /api/health (intégration)', () => {
  it('renvoie 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});
