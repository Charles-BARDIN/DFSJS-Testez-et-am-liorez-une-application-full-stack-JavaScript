import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { getErrorMessage, isRequestCanceled } from './error';

describe('getErrorMessage', () => {
  it("renvoie le message de l'API pour une erreur Axios", () => {
    const error = { isAxiosError: true, response: { data: { message: 'Email already exists' } } };
    expect(getErrorMessage(error, 'fallback')).toBe('Email already exists');
  });

  it('renvoie le repli pour une erreur Axios sans message', () => {
    const error = { isAxiosError: true, response: { data: {} } };
    expect(getErrorMessage(error, 'fallback')).toBe('fallback');
  });

  it('renvoie le repli pour une erreur non-Axios', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});

describe('isRequestCanceled', () => {
  it("détecte l'annulation d'une requête Axios", () => {
    expect(isRequestCanceled(new axios.CanceledError('canceled'))).toBe(true);
  });

  it('renvoie false pour une erreur classique', () => {
    expect(isRequestCanceled(new Error('boom'))).toBe(false);
  });
});
