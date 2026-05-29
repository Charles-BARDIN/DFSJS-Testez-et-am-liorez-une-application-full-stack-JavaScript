import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { generateToken } from '../utils/jwt.util';
import { truncateAll, createTestUser } from '../test/db';

describe('GET /api/user/:id (intégration)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('renvoie 200 avec les infos (sans le mot de passe)', async () => {
    const user = await createTestUser({ email: 'a@b.com', firstName: 'Foo', lastName: 'Bar' });
    const token = generateToken(user.id);

    const res = await request(app).get(`/api/user/${user.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, email: 'a@b.com', firstName: 'Foo' });
    expect(res.body).not.toHaveProperty('password');
  });

  it('renvoie 404 si l’utilisateur n’existe pas', async () => {
    const user = await createTestUser({ email: 'a@b.com' });
    const token = generateToken(user.id);

    const res = await request(app).get('/api/user/9999').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('renvoie 400 pour un id non numérique', async () => {
    const user = await createTestUser({ email: 'a@b.com' });
    const token = generateToken(user.id);

    const res = await request(app).get('/api/user/abc').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('renvoie 401 sans token', async () => {
    const res = await request(app).get('/api/user/1');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/user/:id (intégration)', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('supprime son propre compte (200)', async () => {
    const user = await createTestUser({ email: 'a@b.com' });
    const token = generateToken(user.id);

    const res = await request(app)
      .delete(`/api/user/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored).toBeNull();
  });

  it('renvoie 400 pour un id non numérique', async () => {
    const user = await createTestUser({ email: 'a@b.com' });
    const token = generateToken(user.id);

    const res = await request(app).delete('/api/user/abc').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('renvoie 403 si on tente de supprimer un autre compte', async () => {
    const a = await createTestUser({ email: 'a@b.com' });
    const b = await createTestUser({ email: 'b@c.com' });
    const token = generateToken(a.id);

    const res = await request(app)
      .delete(`/api/user/${b.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/user/promote-admin (intégration)', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(async () => {
    await truncateAll();
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('promeut l’utilisateur en admin (200) en mode development', async () => {
    process.env.NODE_ENV = 'development';
    const user = await createTestUser({ email: 'a@b.com', admin: false });
    const token = generateToken(user.id);

    const res = await request(app)
      .post('/api/user/promote-admin')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.admin).toBe(true);
    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored?.admin).toBe(true);
  });

  it('renvoie 403 si NODE_ENV n’est pas development', async () => {
    process.env.NODE_ENV = 'production';
    const user = await createTestUser({ email: 'a@b.com' });
    const token = generateToken(user.id);

    const res = await request(app)
      .post('/api/user/promote-admin')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(403);
  });
});
