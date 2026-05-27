import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthResponse } from '../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import Navbar from './Navbar';

const admin: AuthResponse = { id: 1, email: 'a@s.com', firstName: 'A', lastName: 'B', admin: true, token: 't' };

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

describe('Navbar (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('affiche Login et Register lorsque l’utilisateur est déconnecté', () => {
    renderNavbar();

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('affiche les liens d’un administrateur connecté', () => {
    localStorage.setItem('user', JSON.stringify(admin));
    localStorage.setItem('token', admin.token);

    renderNavbar();

    expect(screen.getByRole('link', { name: /sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create session/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('déconnecte l’utilisateur et redirige vers /login', async () => {
    localStorage.setItem('user', JSON.stringify(admin));
    localStorage.setItem('token', admin.token);

    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
