import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from './jwt.util';

describe('jwt.util', () => {
  it('génère un token vérifiable contenant userId', () => {
    const token = generateToken(7);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({ userId: 7 });
  });

  it('verifyToken renvoie null pour un token invalide', () => {
    expect(verifyToken('not-a-jwt')).toBeNull();
  });
});
