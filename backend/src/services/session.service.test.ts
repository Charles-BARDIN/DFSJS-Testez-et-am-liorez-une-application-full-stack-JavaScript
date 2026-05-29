import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from './session.service';

const mockSessionRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  exists: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findParticipation: vi.fn(),
  addParticipant: vi.fn(),
  removeParticipant: vi.fn(),
};

const mockUserRepo = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  setAdmin: vi.fn(),
  delete: vi.fn(),
};

const mockTeacherRepo = { findAll: vi.fn(), findById: vi.fn() };

let service: SessionService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new SessionService(
    mockSessionRepo as never,
    mockUserRepo as never,
    mockTeacherRepo as never,
  );
});

const adminUser = { id: 1, email: 'a@s.com', admin: true, firstName: 'A', lastName: 'B', password: 'h', createdAt: new Date(), updatedAt: new Date() };
const regularUser = { ...adminUser, admin: false };
const teacher = { id: 1, firstName: 'M', lastName: 'D', createdAt: new Date(), updatedAt: new Date() };

const sessionFull = (id = 1, userIds: number[] = []) => ({
  id,
  name: 'S',
  date: new Date('2026-09-01'),
  description: 'desc',
  teacherId: 1,
  teacher,
  participants: userIds.map((uid) => ({
    sessionId: id,
    userId: uid,
    user: { id: uid, email: `u${uid}@x.com`, firstName: 'U', lastName: 'X', admin: false, password: 'h', createdAt: new Date(), updatedAt: new Date() },
  })),
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('SessionService.getAll', () => {
  it('renvoie la liste mappée en SessionResponse', async () => {
    mockSessionRepo.findAll.mockResolvedValue([sessionFull(1, [10]), sessionFull(2)]);
    const result = await service.getAll();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, users: [10], teacher: { id: 1 } });
  });
});

describe('SessionService.getById', () => {
  it('renvoie la session trouvée', async () => {
    mockSessionRepo.findById.mockResolvedValue(sessionFull(5));
    const result = await service.getById(5);
    expect(result.id).toBe(5);
  });

  it('throw 404 si introuvable', async () => {
    mockSessionRepo.findById.mockResolvedValue(null);
    await expect(service.getById(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('SessionService.create', () => {
  const data = { name: 'N', date: '2026-09-01', description: 'd', teacherId: 1 };

  it('crée la session pour un admin avec teacher existant', async () => {
    mockUserRepo.findById.mockResolvedValue(adminUser);
    mockTeacherRepo.findById.mockResolvedValue(teacher);
    mockSessionRepo.create.mockResolvedValue(sessionFull(7));

    const result = await service.create(1, data);

    expect(mockSessionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'N', description: 'd', teacherId: 1,
    }));
    expect(result.id).toBe(7);
  });

  it('throw 403 si l’utilisateur n’est pas admin', async () => {
    mockUserRepo.findById.mockResolvedValue(regularUser);
    await expect(service.create(1, data)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockSessionRepo.create).not.toHaveBeenCalled();
  });

  it('throw 403 si l’utilisateur est introuvable', async () => {
    mockUserRepo.findById.mockResolvedValue(null);
    await expect(service.create(1, data)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throw 404 si le teacher n’existe pas', async () => {
    mockUserRepo.findById.mockResolvedValue(adminUser);
    mockTeacherRepo.findById.mockResolvedValue(null);
    await expect(service.create(1, data)).rejects.toMatchObject({ statusCode: 404, message: /Teacher not found/ });
  });
});

describe('SessionService.update', () => {
  it('met à jour les champs fournis', async () => {
    mockUserRepo.findById.mockResolvedValue(adminUser);
    mockSessionRepo.exists.mockResolvedValue({ id: 1 });
    mockSessionRepo.update.mockResolvedValue(sessionFull(1));

    await service.update(1, 1, { name: 'X', date: '2026-10-01' });

    expect(mockSessionRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'X' }));
  });

  it('vérifie l’existence du teacher si teacherId fourni', async () => {
    mockUserRepo.findById.mockResolvedValue(adminUser);
    mockSessionRepo.exists.mockResolvedValue({ id: 1 });
    mockTeacherRepo.findById.mockResolvedValue(null);

    await expect(service.update(1, 1, { teacherId: 99 })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throw 403 si non admin', async () => {
    mockUserRepo.findById.mockResolvedValue(regularUser);
    await expect(service.update(1, 1, { name: 'X' })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throw 404 si la session n’existe pas', async () => {
    mockUserRepo.findById.mockResolvedValue(adminUser);
    mockSessionRepo.exists.mockResolvedValue(null);
    await expect(service.update(1, 1, { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('SessionService.delete', () => {
  it('supprime la session pour un admin', async () => {
    mockUserRepo.findById.mockResolvedValue(adminUser);
    mockSessionRepo.exists.mockResolvedValue({ id: 1 });
    mockSessionRepo.delete.mockResolvedValue({ id: 1 });

    await service.delete(1, 1);

    expect(mockSessionRepo.delete).toHaveBeenCalledWith(1);
  });

  it('throw 403 si non admin', async () => {
    mockUserRepo.findById.mockResolvedValue(regularUser);
    await expect(service.delete(1, 1)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throw 404 si la session n’existe pas', async () => {
    mockUserRepo.findById.mockResolvedValue(adminUser);
    mockSessionRepo.exists.mockResolvedValue(null);
    await expect(service.delete(1, 1)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('SessionService.participate', () => {
  it('ajoute la participation si tout est valide', async () => {
    mockSessionRepo.exists.mockResolvedValue({ id: 1 });
    mockUserRepo.findById.mockResolvedValue(regularUser);
    mockSessionRepo.findParticipation.mockResolvedValue(null);
    mockSessionRepo.addParticipant.mockResolvedValue({});

    await service.participate(1, 10);

    expect(mockSessionRepo.addParticipant).toHaveBeenCalledWith(1, 10);
  });

  it('throw 404 si la session n’existe pas', async () => {
    mockSessionRepo.exists.mockResolvedValue(null);
    await expect(service.participate(1, 10)).rejects.toMatchObject({ statusCode: 404, message: /Session not found/ });
  });

  it('throw 404 si l’utilisateur n’existe pas', async () => {
    mockSessionRepo.exists.mockResolvedValue({ id: 1 });
    mockUserRepo.findById.mockResolvedValue(null);
    await expect(service.participate(1, 99)).rejects.toMatchObject({ statusCode: 404, message: /User not found/ });
  });

  it('throw 400 si l’utilisateur est déjà participant', async () => {
    mockSessionRepo.exists.mockResolvedValue({ id: 1 });
    mockUserRepo.findById.mockResolvedValue(regularUser);
    mockSessionRepo.findParticipation.mockResolvedValue({ sessionId: 1, userId: 10 });
    await expect(service.participate(1, 10)).rejects.toMatchObject({ statusCode: 400, message: /already participating/ });
  });
});

describe('SessionService.unparticipate', () => {
  it('retire la participation existante', async () => {
    mockSessionRepo.findParticipation.mockResolvedValue({ sessionId: 1, userId: 10 });
    mockSessionRepo.removeParticipant.mockResolvedValue({});
    await service.unparticipate(1, 10);
    expect(mockSessionRepo.removeParticipant).toHaveBeenCalledWith(1, 10);
  });

  it('throw 404 si pas de participation', async () => {
    mockSessionRepo.findParticipation.mockResolvedValue(null);
    await expect(service.unparticipate(1, 10)).rejects.toMatchObject({ statusCode: 404 });
  });
});
