import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from './error.middleware';
import { AppError } from '../errors/AppError';

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe('errorHandler', () => {
  it('formate une AppError avec son code et message', () => {
    const res = makeRes();
    errorHandler(new AppError(404, 'Not found'), {} as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
  });

  it('renvoie 500 + message générique pour une erreur inattendue', () => {
    const res = makeRes();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('boom'), {} as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
