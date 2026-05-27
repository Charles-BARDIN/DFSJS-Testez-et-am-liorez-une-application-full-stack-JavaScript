import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthResponse, Session } from '../types';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), delete: vi.fn() } }));

import api from '../services/api';
import Sessions from './Sessions';

const sampleSessions: Session[] = [
  {
    id: 1,
    name: 'Yoga Vinyasa',
    date: '2026-02-15',
    description: 'Cours dynamique',
    teacher: { id: 1, firstName: 'Margot', lastName: 'Delahaye' },
    users: [],
  },
  {
    id: 2,
    name: 'Yoga Hatha',
    date: '2026-02-20',
    description: 'Pratique douce',
    teacher: { id: 2, firstName: 'Hélène', lastName: 'Thiercelin' },
    users: [10],
  },
];

const admin: AuthResponse = { id: 1, email: 'a@s.com', firstName: 'A', lastName: 'B', admin: true, token: 't' };
const regular: AuthResponse = { id: 2, email: 'u@s.com', firstName: 'U', lastName: 'C', admin: false, token: 't' };

function loginAs(user: AuthResponse) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', user.token);
}

function renderSessions() {
  return render(
    <MemoryRouter>
      <Sessions />
    </MemoryRouter>,
  );
}

describe('Sessions (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('affiche la liste des sessions', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockResolvedValue({ data: sampleSessions });

    renderSessions();

    expect(await screen.findByText('Yoga Vinyasa')).toBeInTheDocument();
    expect(screen.getByText('Yoga Hatha')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/session', expect.anything());
    expect(screen.getAllByText('View Details')).toHaveLength(2);
  });

  it('affiche les boutons Create et Delete pour un administrateur', async () => {
    loginAs(admin);
    vi.mocked(api.get).mockResolvedValue({ data: sampleSessions });

    renderSessions();

    expect(await screen.findByText('Yoga Vinyasa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create session/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2);
  });

  it('masque les boutons Create et Delete pour un utilisateur non-admin', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockResolvedValue({ data: sampleSessions });

    renderSessions();

    expect(await screen.findByText('Yoga Vinyasa')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /create session/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('supprime une session après confirmation', async () => {
    loginAs(admin);
    vi.mocked(api.get).mockResolvedValue({ data: sampleSessions });
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'ok' } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderSessions();

    await screen.findByText('Yoga Vinyasa');
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    expect(api.delete).toHaveBeenCalledWith('/session/1');
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  it('affiche une erreur si le chargement échoue', async () => {
    loginAs(regular);
    vi.mocked(api.get).mockRejectedValue(new Error('network'));

    renderSessions();

    expect(await screen.findByText('Failed to load sessions')).toBeInTheDocument();
  });

  it('annule la suppression si l’utilisateur refuse la confirmation', async () => {
    loginAs(admin);
    vi.mocked(api.get).mockResolvedValue({ data: sampleSessions });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const user = userEvent.setup();
    renderSessions();

    await screen.findByText('Yoga Vinyasa');
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    expect(api.delete).not.toHaveBeenCalled();
  });
});
