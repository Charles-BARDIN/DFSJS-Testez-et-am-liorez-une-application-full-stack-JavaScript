import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  default: { post: vi.fn() },
}));

import api from './api';
import { authService } from './auth.service';
import { AuthResponse } from '../types';

const authData: AuthResponse = {
  id: 1,
  email: 'yoga@studio.com',
  firstName: 'Admin',
  lastName: 'Yoga',
  admin: true,
  token: 'jwt-token',
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('appelle l’API et stocke le token et l’utilisateur', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: authData });

      const result = await authService.login({ email: 'yoga@studio.com', password: 'test!1234' });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'yoga@studio.com',
        password: 'test!1234',
      });
      expect(result).toEqual(authData);
      expect(localStorage.getItem('token')).toBe('jwt-token');
      expect(JSON.parse(localStorage.getItem('user') as string)).toEqual(authData);
    });

    it('ne stocke rien si la réponse ne contient pas de token', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { ...authData, token: '' } });

      await authService.login({ email: 'yoga@studio.com', password: 'test!1234' });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('register', () => {
    it('appelle l’API et stocke le token et l’utilisateur', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: authData });

      const result = await authService.register({
        email: 'yoga@studio.com',
        password: 'test!1234',
        firstName: 'Admin',
        lastName: 'Yoga',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
        email: 'yoga@studio.com',
      }));
      expect(result).toEqual(authData);
      expect(localStorage.getItem('token')).toBe('jwt-token');
    });

    it('ne stocke rien si la réponse ne contient pas de token', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { ...authData, token: '' } });

      await authService.register({
        email: 'yoga@studio.com',
        password: 'test!1234',
        firstName: 'Admin',
        lastName: 'Yoga',
      });

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('supprime le token et l’utilisateur du localStorage', () => {
      localStorage.setItem('token', 'jwt-token');
      localStorage.setItem('user', JSON.stringify(authData));

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('renvoie l’utilisateur stocké', () => {
      localStorage.setItem('user', JSON.stringify(authData));
      expect(authService.getCurrentUser()).toEqual(authData);
    });

    it('renvoie null si aucun utilisateur n’est stocké', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('updateCurrentUser', () => {
    it('fusionne les modifications dans l’utilisateur stocké', () => {
      localStorage.setItem('user', JSON.stringify(authData));

      const updated = authService.updateCurrentUser({ admin: false });

      expect(updated?.admin).toBe(false);
      expect(JSON.parse(localStorage.getItem('user') as string).admin).toBe(false);
    });

    it('renvoie null si aucun utilisateur n’est stocké', () => {
      expect(authService.updateCurrentUser({ admin: true })).toBeNull();
    });
  });

  describe('getToken / isAuthenticated', () => {
    it('renvoie le token et true quand connecté', () => {
      localStorage.setItem('token', 'jwt-token');
      expect(authService.getToken()).toBe('jwt-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('renvoie null et false quand déconnecté', () => {
      expect(authService.getToken()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
