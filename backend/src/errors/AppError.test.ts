import { describe, it, expect } from 'vitest';
import { AppError } from './AppError';

describe('AppError', () => {
  it('porte un statusCode et un message', () => {
    const err = new AppError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('AppError');
  });

  it('est une instance d’Error', () => {
    const err = new AppError(400, 'bad');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
