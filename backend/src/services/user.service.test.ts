import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { AppError } from '../errors/AppError';

const mockRepo = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  setAdmin: vi.fn(),
  delete: vi.fn(),
};

let service: UserService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new UserService(mockRepo as never);
});

const baseUser = (admin = false) => ({
  id: 1,
  email: 'a@b.com',
  firstName: 'A',
  lastName: 'B',
  admin,
  password: 'h',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('UserService.getById', () => {
  it('renvoie le user mappé', async () => {
    mockRepo.findById.mockResolvedValue(baseUser());
    const result = await service.getById(1);
    expect(result).toMatchObject({ id: 1, email: 'a@b.com', admin: false });
    expect(result).not.toHaveProperty('password');
  });

  it('throw 404 si introuvable', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getById(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('UserService.delete', () => {
  it('supprime un utilisateur qui supprime son propre compte', async () => {
    mockRepo.findById.mockResolvedValue(baseUser());
    mockRepo.delete.mockResolvedValue(baseUser());
    await service.delete(1, 1);
    expect(mockRepo.delete).toHaveBeenCalledWith(1);
  });

  it('throw 403 si le requester veut supprimer un autre compte', async () => {
    await expect(service.delete(1, 2)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('throw 403 si requesterId est undefined', async () => {
    await expect(service.delete(undefined, 2)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throw 404 si l’utilisateur cible n’existe pas', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.delete(7, 7)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('UserService.promoteSelfToAdmin', () => {
  it('renvoie l’utilisateur tel quel s’il est déjà admin', async () => {
    mockRepo.findById.mockResolvedValue(baseUser(true));
    const result = await service.promoteSelfToAdmin(1);
    expect(result.admin).toBe(true);
    expect(mockRepo.setAdmin).not.toHaveBeenCalled();
  });

  it('promeut l’utilisateur si non admin', async () => {
    mockRepo.findById.mockResolvedValue(baseUser(false));
    mockRepo.setAdmin.mockResolvedValue(baseUser(true));
    const result = await service.promoteSelfToAdmin(1);
    expect(mockRepo.setAdmin).toHaveBeenCalledWith(1, true);
    expect(result.admin).toBe(true);
  });

  it('throw 404 si l’utilisateur n’existe pas', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.promoteSelfToAdmin(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});
