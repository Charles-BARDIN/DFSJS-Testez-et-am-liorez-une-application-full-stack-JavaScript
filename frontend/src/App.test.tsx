import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from './services/api';
import App from './App';

describe('App — routing et PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('redirige un visiteur non authentifié vers la page de connexion', async () => {
    render(<App />);

    expect(await screen.findByText('Login to Yoga Studio')).toBeInTheDocument();
  });

  it('affiche les sessions pour un utilisateur authentifié', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, email: 'a@s.com', firstName: 'A', lastName: 'B', admin: true, token: 't' }),
    );
    localStorage.setItem('token', 't');
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Yoga Sessions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
