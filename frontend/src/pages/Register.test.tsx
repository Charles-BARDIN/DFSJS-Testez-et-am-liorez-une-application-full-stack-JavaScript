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
import Register from './Register';

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
}

describe('Register (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('crée un compte et redirige vers /sessions', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { id: 2, email: 'new@user.com', firstName: 'New', lastName: 'User', admin: false, token: 'tok' },
    });
    const user = userEvent.setup();
    const { container } = renderRegister();

    await user.type(container.querySelector('input[name="firstName"]') as HTMLInputElement, 'New');
    await user.type(container.querySelector('input[name="lastName"]') as HTMLInputElement, 'User');
    await user.type(container.querySelector('input[name="email"]') as HTMLInputElement, 'new@user.com');
    await user.type(container.querySelector('input[name="password"]') as HTMLInputElement, 'test!1234');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      firstName: 'New',
      lastName: 'User',
      email: 'new@user.com',
      password: 'test!1234',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/sessions');
  });

  it('affiche une erreur renvoyée par l’API', async () => {
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Email already exists' } },
    });
    const user = userEvent.setup();
    const { container } = renderRegister();

    await user.type(container.querySelector('input[name="firstName"]') as HTMLInputElement, 'New');
    await user.type(container.querySelector('input[name="lastName"]') as HTMLInputElement, 'User');
    await user.type(container.querySelector('input[name="email"]') as HTMLInputElement, 'taken@user.com');
    await user.type(container.querySelector('input[name="password"]') as HTMLInputElement, 'test!1234');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('marque tous les champs obligatoires', () => {
    const { container } = renderRegister();

    expect(container.querySelector('input[name="firstName"]')).toBeRequired();
    expect(container.querySelector('input[name="lastName"]')).toBeRequired();
    expect(container.querySelector('input[name="email"]')).toBeRequired();
    expect(container.querySelector('input[name="password"]')).toBeRequired();
  });
});
