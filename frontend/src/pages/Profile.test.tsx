import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthResponse } from '../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), delete: vi.fn(), post: vi.fn() },
}));

import api from '../services/api';
import Profile from './Profile';

const currentUser: AuthResponse = { id: 1, email: 'john@test.com', firstName: 'John', lastName: 'Doe', admin: false, token: 't' };

const profileData = {
  id: 1,
  email: 'john@test.com',
  firstName: 'John',
  lastName: 'Doe',
  admin: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderProfile() {
  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>,
  );
}

describe('Profile (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem('token', currentUser.token);
  });

  it('affiche les informations de l’utilisateur', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profileData });

    renderProfile();

    expect(await screen.findByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/user/1', expect.anything());
  });

  it('supprime le compte puis redirige vers /login', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profileData });
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'ok' } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('button', { name: /delete account/i }));

    expect(api.delete).toHaveBeenCalledWith('/user/1');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('permet la promotion en admin (mode dev)', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profileData });
    vi.mocked(api.post).mockResolvedValue({ data: { ...profileData, admin: true } });

    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('button', { name: /promote to admin/i }));

    expect(api.post).toHaveBeenCalledWith('/user/promote-admin', {});
    expect(await screen.findByText('Administrator')).toBeInTheDocument();
  });

  it('affiche une erreur si le chargement échoue', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network'));

    renderProfile();

    expect(await screen.findByText('Failed to load user information')).toBeInTheDocument();
  });

  it('annule la suppression du compte si non confirmée', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profileData });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('button', { name: /delete account/i }));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('affiche une alerte si la suppression du compte échoue', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profileData });
    vi.mocked(api.delete).mockRejectedValue(new Error('network'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('button', { name: /delete account/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to delete account'));
  });

  it('affiche une erreur si la promotion échoue', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: profileData });
    vi.mocked(api.post).mockRejectedValue(new Error('network'));

    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('button', { name: /promote to admin/i }));

    expect(await screen.findByText('Failed to promote to admin')).toBeInTheDocument();
  });
});
