import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { truncateAll, createTestUser } from '../test/db';

beforeEach(async () => {
  await truncateAll();
});

describe('POST /api/auth/register (intégration)', () => {
  it('crée un compte (201) et renvoie un token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@u.com', password: 'test!1234', firstName: 'New', lastName: 'User' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'new@u.com', admin: false });
    expect(typeof res.body.token).toBe('string');

    const stored = await prisma.user.findUnique({ where: { email: 'new@u.com' } });
    expect(stored).not.toBeNull();
    expect(stored?.password).not.toBe('test!1234'); // hashé
  });

  it('renvoie 400 si l’email est déjà pris', async () => {
    await createTestUser({ email: 'taken@u.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'taken@u.com', password: 'test!1234', firstName: 'Foo', lastName: 'Bar' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('renvoie 400 si un champ obligatoire est manquant (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@u.com', password: 'test!1234', firstName: 'Foo' }); // pas de lastName

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/lastName/);
  });

  it('renvoie 400 si l’email est mal formé (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'test!1234', firstName: 'Foo', lastName: 'Bar' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('renvoie 400 si le mot de passe fait moins de 8 caractères (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@u.com', password: 'short', firstName: 'Foo', lastName: 'Bar' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password/i);
  });
});

describe('POST /api/auth/login (intégration)', () => {
  beforeEach(async () => {
    await createTestUser({ email: 'a@b.com', password: 'test!1234', admin: true });
  });

  it('renvoie 200 + token pour des identifiants valides', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'test!1234' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'a@b.com', admin: true });
    expect(typeof res.body.token).toBe('string');
  });

  it('renvoie 401 si le mot de passe est incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrong-pw' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid credentials/);
  });

  it('renvoie 401 si l’utilisateur n’existe pas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@u.com', password: 'test!1234' });

    expect(res.status).toBe(401);
  });

  it('renvoie 400 si l’email est manquant (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'test!1234' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });
});
