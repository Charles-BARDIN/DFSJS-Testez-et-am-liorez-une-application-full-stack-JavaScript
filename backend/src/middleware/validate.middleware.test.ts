import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validateBody } from './validate.middleware';
import { AppError } from '../errors/AppError';

const schema = z.object({ name: z.string().min(3) });

describe('validateBody', () => {
  it('appelle next() et nettoie req.body en cas de succès', () => {
    const req = { body: { name: 'foo', extra: 'drop me' } } as { body: unknown };
    const next = vi.fn();
    validateBody(schema)(req as never, {} as never, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'foo' });
  });

  it('appelle next(AppError 400) avec message composé en cas d’échec', () => {
    const req = { body: { name: 'a' } } as { body: unknown };
    const next = vi.fn();
    validateBody(schema)(req as never, {} as never, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/name/);
  });

  it('inclut le chemin du champ dans le message', () => {
    const nested = z.object({ user: z.object({ email: z.string().email() }) });
    const req = { body: { user: { email: 'bad' } } } as { body: unknown };
    const next = vi.fn();
    validateBody(nested)(req as never, {} as never, next);
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/user\.email/);
  });
});
