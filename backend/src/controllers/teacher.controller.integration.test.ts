import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt.util';
import { truncateAll, createTestUser, createTestTeacher } from '../test/db';

let token: string;

beforeEach(async () => {
  await truncateAll();
  const user = await createTestUser({ email: 'a@b.com' });
  token = generateToken(user.id);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/teacher (intégration)', () => {
  it('renvoie la liste des teachers (200)', async () => {
    await createTestTeacher('Margot', 'Delahaye');
    await createTestTeacher('Hélène', 'Thiercelin');

    const res = await request(app).get('/api/teacher').set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ firstName: expect.any(String) });
  });

  it('renvoie 401 sans token', async () => {
    const res = await request(app).get('/api/teacher');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/teacher/:id (intégration)', () => {
  it('renvoie le teacher demandé (200)', async () => {
    const t = await createTestTeacher();
    const res = await request(app).get(`/api/teacher/${t.id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: t.id });
  });

  it('renvoie 404 si introuvable', async () => {
    const res = await request(app).get('/api/teacher/9999').set(auth());
    expect(res.status).toBe(404);
  });

  it('renvoie 400 pour un id non numérique', async () => {
    const res = await request(app).get('/api/teacher/abc').set(auth());
    expect(res.status).toBe(400);
  });
});
