import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from './asyncHandler';

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('asyncHandler', () => {
  it('appelle le handler et ne touche pas à next en cas de succès', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const next = vi.fn();
    asyncHandler(handler)({} as never, {} as never, next);
    await flush();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('transmet le rejet de la promesse à next() (chemin vers le middleware d’erreur)', async () => {
    const err = new Error('boom');
    const handler = vi.fn().mockRejectedValue(err);
    const next = vi.fn();
    asyncHandler(handler)({} as never, {} as never, next);
    await flush();
    expect(next).toHaveBeenCalledWith(err);
  });
});
