import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({ default: { post: vi.fn() } }));

import api from '../services/api';
import Login from './Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('connecte l’utilisateur et redirige vers /sessions', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { id: 1, email: 'yoga@studio.com', firstName: 'A', lastName: 'B', admin: true, token: 'tok' },
    });
    const user = userEvent.setup();
    const { container } = renderLogin();

    await user.type(container.querySelector('input[type="email"]') as HTMLInputElement, 'yoga@studio.com');
    await user.type(container.querySelector('input[type="password"]') as HTMLInputElement, 'test!1234');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'yoga@studio.com',
      password: 'test!1234',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
    expect(localStorage.getItem('token')).toBe('tok');
  });

  it('affiche une erreur en cas de mauvais login / password', async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Invalid credentials' } },
    });
    const user = userEvent.setup();
    const { container } = renderLogin();

    await user.type(container.querySelector('input[type="email"]') as HTMLInputElement, 'wrong@studio.com');
    await user.type(container.querySelector('input[type="password"]') as HTMLInputElement, 'badpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('marque les champs email et mot de passe comme obligatoires', () => {
    const { container } = renderLogin();

    expect(container.querySelector('input[type="email"]')).toBeRequired();
    expect(container.querySelector('input[type="password"]')).toBeRequired();
  });
});
