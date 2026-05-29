import { describe, it, expect, vi } from 'vitest';
import { authMiddleware, AuthRequest } from './auth.middleware';
import { generateToken } from '../utils/jwt.util';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('authMiddleware', () => {
  it('401 « No token provided » si aucun header Authorization', () => {
    const req = { headers: {} } as AuthRequest;
    const res = makeRes();
    const next = vi.fn();
    authMiddleware(req, res as never, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('401 « Invalid token format » si pas de token après Bearer', () => {
    const req = { headers: { authorization: 'Bearer' } } as AuthRequest;
    const res = makeRes();
    const next = vi.fn();
    authMiddleware(req, res as never, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token format' });
  });

  it('401 « Invalid or expired token » si token invalide', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } } as AuthRequest;
    const res = makeRes();
    const next = vi.fn();
    authMiddleware(req, res as never, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  it('définit req.userId et appelle next() si token valide', () => {
    const token = generateToken(42);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = makeRes();
    const next = vi.fn();
    authMiddleware(req, res as never, next);
    expect(req.userId).toBe(42);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
