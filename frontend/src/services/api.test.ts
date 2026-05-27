import { describe, it, expect, beforeEach } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import api from './api';

type FulfilledInterceptor = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig;

function getRequestInterceptor(): FulfilledInterceptor {
  // L'intercepteur enregistré est stocké dans le manager d'Axios.
  const manager = api.interceptors.request as unknown as {
    handlers: { fulfilled: FulfilledInterceptor }[];
  };
  return manager.handlers[0].fulfilled;
}

describe('api request interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ajoute l’en-tête Authorization quand un token est présent', () => {
    localStorage.setItem('token', 'jwt-token');
    const config = { headers: {} } as unknown as InternalAxiosRequestConfig;

    const result = getRequestInterceptor()(config);

    expect(result.headers.Authorization).toBe('Bearer jwt-token');
  });

  it('n’ajoute pas d’en-tête Authorization sans token', () => {
    const config = { headers: {} } as unknown as InternalAxiosRequestConfig;

    const result = getRequestInterceptor()(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});
