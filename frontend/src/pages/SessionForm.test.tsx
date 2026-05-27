import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthResponse, Session, Teacher } from '../types';

const { mockNavigate, params } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  params: { current: {} as Record<string, string> },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => params.current };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import api from '../services/api';
import SessionForm from './SessionForm';

const admin: AuthResponse = { id: 1, email: 'a@s.com', firstName: 'A', lastName: 'B', admin: true, token: 't' };

const teachers: Teacher[] = [
  { id: 1, firstName: 'Margot', lastName: 'Delahaye' },
  { id: 2, firstName: 'Hélène', lastName: 'Thiercelin' },
];

const existingSession: Session = {
  id: 1,
  name: 'Yoga Vinyasa',
  date: '2026-02-15',
  description: 'Cours dynamique',
  teacher: { id: 1, firstName: 'Margot', lastName: 'Delahaye' },
  users: [],
};

function renderForm() {
  return render(
    <MemoryRouter>
      <SessionForm />
    </MemoryRouter>,
  );
}

describe('SessionForm (intégration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    params.current = {};
    localStorage.setItem('user', JSON.stringify(admin));
    localStorage.setItem('token', admin.token);
  });

  it('crée une session', async () => {
    params.current = {};
    vi.mocked(api.get).mockResolvedValue({ data: teachers });
    vi.mocked(api.post).mockResolvedValue({ data: { id: 5 } });

    const { container } = renderForm();
    // Attend le chargement des enseignants dans le select.
    await screen.findByRole('option', { name: /Margot Delahaye/ });

    fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, { target: { value: 'Morning Yoga' } });
    fireEvent.change(container.querySelector('input[name="date"]') as HTMLInputElement, { target: { value: '2026-03-01' } });
    fireEvent.change(container.querySelector('select[name="teacherId"]') as HTMLSelectElement, { target: { value: '1' } });
    fireEvent.change(container.querySelector('textarea[name="description"]') as HTMLTextAreaElement, { target: { value: 'A nice morning session' } });

    await userEvent.setup().click(screen.getByRole('button', { name: /create session/i }));

    expect(api.post).toHaveBeenCalledWith('/session', {
      name: 'Morning Yoga',
      date: '2026-03-01',
      description: 'A nice morning session',
      teacherId: 1,
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/sessions'));
  });

  it('marque les champs du formulaire comme obligatoires', async () => {
    params.current = {};
    vi.mocked(api.get).mockResolvedValue({ data: teachers });

    const { container } = renderForm();
    await screen.findByRole('option', { name: /Margot Delahaye/ });

    expect(container.querySelector('input[name="name"]')).toBeRequired();
    expect(container.querySelector('input[name="date"]')).toBeRequired();
    expect(container.querySelector('select[name="teacherId"]')).toBeRequired();
    expect(container.querySelector('textarea[name="description"]')).toBeRequired();
  });

  it('modifie une session existante', async () => {
    params.current = { id: '1' };
    vi.mocked(api.get).mockImplementation((url: string) =>
      url === '/teacher'
        ? Promise.resolve({ data: teachers })
        : Promise.resolve({ data: existingSession }),
    );
    vi.mocked(api.put).mockResolvedValue({ data: existingSession });

    const { container } = renderForm();
    // Le formulaire est pré-rempli avec la session chargée.
    await screen.findByDisplayValue('Yoga Vinyasa');

    fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, { target: { value: 'Yoga Vinyasa Plus' } });
    await userEvent.setup().click(screen.getByRole('button', { name: /update session/i }));

    expect(api.put).toHaveBeenCalledWith('/session/1', expect.objectContaining({ name: 'Yoga Vinyasa Plus' }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/sessions'));
  });

  it('affiche une erreur si l’enregistrement échoue', async () => {
    params.current = {};
    vi.mocked(api.get).mockResolvedValue({ data: teachers });
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'name: Too small' } },
    });

    const { container } = renderForm();
    await screen.findByRole('option', { name: /Margot Delahaye/ });

    fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, { target: { value: 'ab' } });
    fireEvent.change(container.querySelector('input[name="date"]') as HTMLInputElement, { target: { value: '2026-03-01' } });
    fireEvent.change(container.querySelector('select[name="teacherId"]') as HTMLSelectElement, { target: { value: '1' } });
    fireEvent.change(container.querySelector('textarea[name="description"]') as HTMLTextAreaElement, { target: { value: 'desc' } });
    await userEvent.setup().click(screen.getByRole('button', { name: /create session/i }));

    expect(await screen.findByText('name: Too small')).toBeInTheDocument();
  });

  it('affiche une erreur si le chargement de la session échoue', async () => {
    params.current = { id: '1' };
    vi.mocked(api.get).mockImplementation((url: string) =>
      url === '/teacher'
        ? Promise.resolve({ data: teachers })
        : Promise.reject(new Error('network')),
    );

    renderForm();

    expect(await screen.findByText('Failed to load session')).toBeInTheDocument();
  });
});
