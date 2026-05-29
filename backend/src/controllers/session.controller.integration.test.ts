import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { generateToken } from '../utils/jwt.util';
import {
  truncateAll,
  createTestUser,
  createTestTeacher,
  createTestSession,
} from '../test/db';

let adminToken: string;
let regularToken: string;
let regularUserId: number;
let teacherId: number;

beforeEach(async () => {
  await truncateAll();
  const admin = await createTestUser({ email: 'admin@s.com', admin: true });
  const user = await createTestUser({ email: 'user@s.com', admin: false });
  const teacher = await createTestTeacher();
  adminToken = generateToken(admin.id);
  regularToken = generateToken(user.id);
  regularUserId = user.id;
  teacherId = teacher.id;
});

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('GET /api/session (intégration)', () => {
  it('renvoie la liste (200)', async () => {
    await createTestSession({ teacherId });

    const res = await request(app).get('/api/session').set(auth(regularToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'Test Session', users: [] });
  });

  it('renvoie 401 sans token', async () => {
    const res = await request(app).get('/api/session');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/session/:id (intégration)', () => {
  it('renvoie la session (200)', async () => {
    const s = await createTestSession({ teacherId });
    const res = await request(app).get(`/api/session/${s.id}`).set(auth(regularToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: s.id, name: 'Test Session' });
  });

  it('renvoie 404 si introuvable', async () => {
    const res = await request(app).get('/api/session/9999').set(auth(regularToken));
    expect(res.status).toBe(404);
  });

  it('renvoie 400 pour un id non numérique', async () => {
    const res = await request(app).get('/api/session/abc').set(auth(regularToken));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/session (intégration)', () => {
  const validBody = (overrides: Record<string, unknown> = {}) => ({
    name: 'New Session',
    date: '2026-10-01',
    description: 'A new session',
    teacherId: 0,
    ...overrides,
  });

  it('admin crée une session (201)', async () => {
    const res = await request(app)
      .post('/api/session')
      .set(auth(adminToken))
      .send(validBody({ teacherId }));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'New Session', users: [] });
    const stored = await prisma.session.count();
    expect(stored).toBe(1);
  });

  it('renvoie 403 si non-admin', async () => {
    const res = await request(app)
      .post('/api/session')
      .set(auth(regularToken))
      .send(validBody({ teacherId }));

    expect(res.status).toBe(403);
  });

  it('renvoie 404 si le teacher n’existe pas', async () => {
    const res = await request(app)
      .post('/api/session')
      .set(auth(adminToken))
      .send(validBody({ teacherId: 9999 }));

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Teacher/);
  });

  it('renvoie 400 si nom trop court (Zod)', async () => {
    const res = await request(app)
      .post('/api/session')
      .set(auth(adminToken))
      .send(validBody({ teacherId, name: 'ab' }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name/i);
  });
});

describe('Validations de paramètres (intégration)', () => {
  it('PUT /api/session/abc renvoie 400', async () => {
    const res = await request(app).put('/api/session/abc').set(auth(adminToken)).send({ name: 'Renamed' });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/session/abc renvoie 400', async () => {
    const res = await request(app).delete('/api/session/abc').set(auth(adminToken));
    expect(res.status).toBe(400);
  });

  it('POST /api/session/abc/participate/2 renvoie 400', async () => {
    const res = await request(app).post('/api/session/abc/participate/2').set(auth(regularToken));
    expect(res.status).toBe(400);
  });

  it('POST /api/session/1/participate/abc renvoie 400', async () => {
    const res = await request(app).post('/api/session/1/participate/abc').set(auth(regularToken));
    expect(res.status).toBe(400);
  });

  it('DELETE /api/session/abc/participate/2 renvoie 400', async () => {
    const res = await request(app).delete('/api/session/abc/participate/2').set(auth(regularToken));
    expect(res.status).toBe(400);
  });

  it('POST /api/session/:id/participate/:userId renvoie 404 si user inconnu', async () => {
    const s = await createTestSession({ teacherId });
    const res = await request(app)
      .post(`/api/session/${s.id}/participate/9999`)
      .set(auth(regularToken));
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/User/);
  });
});

describe('PUT /api/session/:id (intégration)', () => {
  it('admin modifie une session (200)', async () => {
    const s = await createTestSession({ teacherId });

    const res = await request(app)
      .put(`/api/session/${s.id}`)
      .set(auth(adminToken))
      .send({ name: 'Renamed Session' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed Session');
  });

  it('renvoie 403 si non-admin', async () => {
    const s = await createTestSession({ teacherId });
    const res = await request(app)
      .put(`/api/session/${s.id}`)
      .set(auth(regularToken))
      .send({ name: 'Renamed' });
    expect(res.status).toBe(403);
  });

  it('renvoie 404 si la session n’existe pas', async () => {
    const res = await request(app)
      .put('/api/session/9999')
      .set(auth(adminToken))
      .send({ name: 'Renamed' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/session/:id (intégration)', () => {
  it('admin supprime la session (200)', async () => {
    const s = await createTestSession({ teacherId });

    const res = await request(app)
      .delete(`/api/session/${s.id}`)
      .set(auth(adminToken));

    expect(res.status).toBe(200);
    const remaining = await prisma.session.count();
    expect(remaining).toBe(0);
  });

  it('renvoie 403 si non-admin', async () => {
    const s = await createTestSession({ teacherId });
    const res = await request(app)
      .delete(`/api/session/${s.id}`)
      .set(auth(regularToken));
    expect(res.status).toBe(403);
  });

  it('renvoie 404 si la session n’existe pas', async () => {
    const res = await request(app)
      .delete('/api/session/9999')
      .set(auth(adminToken));
    expect(res.status).toBe(404);
  });
});

describe('Participation (intégration)', () => {
  it('participe à une session (200)', async () => {
    const s = await createTestSession({ teacherId });

    const res = await request(app)
      .post(`/api/session/${s.id}/participate/${regularUserId}`)
      .set(auth(regularToken));

    expect(res.status).toBe(200);
    const part = await prisma.sessionParticipation.count();
    expect(part).toBe(1);
  });

  it('renvoie 400 si déjà participant', async () => {
    const s = await createTestSession({ teacherId });
    await prisma.sessionParticipation.create({ data: { sessionId: s.id, userId: regularUserId } });

    const res = await request(app)
      .post(`/api/session/${s.id}/participate/${regularUserId}`)
      .set(auth(regularToken));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  it('renvoie 404 si la session n’existe pas', async () => {
    const res = await request(app)
      .post(`/api/session/9999/participate/${regularUserId}`)
      .set(auth(regularToken));
    expect(res.status).toBe(404);
  });

  it('annule la participation (200)', async () => {
    const s = await createTestSession({ teacherId });
    await prisma.sessionParticipation.create({ data: { sessionId: s.id, userId: regularUserId } });

    const res = await request(app)
      .delete(`/api/session/${s.id}/participate/${regularUserId}`)
      .set(auth(regularToken));

    expect(res.status).toBe(200);
    const part = await prisma.sessionParticipation.count();
    expect(part).toBe(0);
  });

  it('renvoie 404 si aucune participation à annuler', async () => {
    const s = await createTestSession({ teacherId });
    const res = await request(app)
      .delete(`/api/session/${s.id}/participate/${regularUserId}`)
      .set(auth(regularToken));
    expect(res.status).toBe(404);
  });
});
