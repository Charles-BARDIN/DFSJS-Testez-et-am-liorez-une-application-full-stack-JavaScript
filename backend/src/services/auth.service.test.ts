import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AppError } from '../errors/AppError';

const mockRepo = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  setAdmin: vi.fn(),
  delete: vi.fn(),
};

let service: AuthService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new AuthService(mockRepo as never);
});

describe('AuthService.login', () => {
  it('renvoie l’utilisateur + token pour un login valide', async () => {
    const hash = await bcrypt.hash('test!1234', 4);
    mockRepo.findByEmail.mockResolvedValue({
      id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B', admin: true, password: hash,
    });

    const result = await service.login('a@b.com', 'test!1234');

    expect(mockRepo.findByEmail).toHaveBeenCalledWith('a@b.com');
    expect(result).toMatchObject({ id: 1, email: 'a@b.com', admin: true });
    expect(typeof result.token).toBe('string');
  });

  it('throw 401 si l’utilisateur n’existe pas', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    await expect(service.login('a@b.com', 'x')).rejects.toBeInstanceOf(AppError);
    await expect(service.login('a@b.com', 'x')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throw 401 si le mot de passe est invalide', async () => {
    const hash = await bcrypt.hash('correct', 4);
    mockRepo.findByEmail.mockResolvedValue({
      id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B', admin: false, password: hash,
    });
    await expect(service.login('a@b.com', 'wrong')).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('AuthService.register', () => {
  it('crée un nouvel utilisateur (hash) et renvoie le token', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({
      id: 2, email: 'new@u.com', firstName: 'N', lastName: 'U', admin: false,
    });

    const result = await service.register({
      email: 'new@u.com', password: 'test!1234', firstName: 'N', lastName: 'U',
    });

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    const arg = mockRepo.create.mock.calls[0][0];
    expect(arg.email).toBe('new@u.com');
    expect(arg.password).not.toBe('test!1234'); // hashé
    expect(arg.admin).toBe(false);
    expect(result).toMatchObject({ id: 2, email: 'new@u.com' });
    expect(typeof result.token).toBe('string');
  });

  it('throw 400 si l’email existe déjà', async () => {
    mockRepo.findByEmail.mockResolvedValue({ id: 1 });
    await expect(
      service.register({ email: 'taken@u.com', password: 'test!1234', firstName: 'X', lastName: 'Y' }),
    ).rejects.toMatchObject({ statusCode: 400, message: /Email already exists/ });
  });
});
