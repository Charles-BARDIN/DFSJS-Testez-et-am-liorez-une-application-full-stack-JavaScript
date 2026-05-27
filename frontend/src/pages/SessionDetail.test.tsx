import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthResponse, Session } from '../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import api from '../services/api';
import SessionDetail from './SessionDetail';

const admin: AuthResponse = { id: 1, email: 'a@s.com', firstName: 'A', lastName: 'B', admin: true, token: 't' };
const regular: AuthResponse = { id: 2, email: 'u@s.com', firstName: 'U', lastName: 'C', admin: false, token: 't' };

function loginAs(user: AuthResponse) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', user.token);
}

function makeSession(users: number[] = []): Session {
  return {
    id: 1,
    name: 'Yoga Vinyasa',
    date: '2026-02-15',
    description: 'Cours dynamique de yoga',
    teacher: { id: 1, firstName: 'Margot', lastName: 'Delahaye' },
    users,
  };
}

function renderDetail() {
  return render(
    <MemoryRouter>
      <SessionDetail />
    </MemoryRouter>,
  );
}

describe('SessionDetail (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('affiche correctement les informations de la session', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockResolvedValue({ data: makeSession([10]) });

    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Yoga Vinyasa' })).toBeInTheDocument();
    expect(screen.getByText(/Margot Delahaye/)).toBeInTheDocument();
    expect(screen.getByText(/Cours dynamique de yoga/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('affiche les boutons Edit et Delete pour un administrateur', async () => {
    loginAs(admin);
    vi.mocked(api.get).mockResolvedValue({ data: makeSession() });

    renderDetail();

    expect(await screen.findByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('permet à un utilisateur de rejoindre une session', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockResolvedValue({ data: makeSession([]) });
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'ok' } });

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /join session/i }));

    expect(api.post).toHaveBeenCalledWith('/session/1/participate/2', {});
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  it('permet à un participant de quitter une session', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockResolvedValue({ data: makeSession([2]) });
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'ok' } });

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /leave session/i }));

    expect(api.delete).toHaveBeenCalledWith('/session/1/participate/2');
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  it('supprime la session et redirige (admin)', async () => {
    loginAs(admin);
    vi.mocked(api.get).mockResolvedValue({ data: makeSession() });
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'ok' } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /delete/i }));

    expect(api.delete).toHaveBeenCalledWith('/session/1');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/sessions'));
  });

  it('affiche une erreur si le chargement de la session échoue', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockRejectedValue(new Error('network'));

    renderDetail();

    expect(await screen.findByText('Failed to load session details')).toBeInTheDocument();
  });

  it('affiche « Session not found » si la session est introuvable', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockResolvedValue({ data: null });

    renderDetail();

    expect(await screen.findByText('Session not found')).toBeInTheDocument();
  });

  it('affiche une alerte si la participation échoue', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockResolvedValue({ data: makeSession([]) });
    vi.mocked(api.post).mockRejectedValue(new Error('network'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /join session/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to join session'));
  });

  it('affiche une alerte si la suppression échoue (admin)', async () => {
    loginAs(admin);
    vi.mocked(api.get).mockResolvedValue({ data: makeSession() });
    vi.mocked(api.delete).mockRejectedValue(new Error('network'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /delete/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to delete session'));
  });
});
