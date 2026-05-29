import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * Vide toutes les tables et remet les séquences à zéro.
 * À appeler dans un beforeEach des tests d'intégration pour partir d'un état propre.
 */
export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "PARTICIPATE", "sessions", "users", "teachers" RESTART IDENTITY CASCADE',
  );
}

interface CreateUserOptions {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  admin?: boolean;
}

export async function createTestUser(opts: CreateUserOptions) {
  const password = await bcrypt.hash(opts.password ?? 'test!1234', 10);
  return prisma.user.create({
    data: {
      email: opts.email,
      password,
      firstName: opts.firstName ?? 'Test',
      lastName: opts.lastName ?? 'User',
      admin: opts.admin ?? false,
    },
  });
}

export async function createTestTeacher(firstName = 'Margot', lastName = 'Delahaye') {
  return prisma.teacher.create({ data: { firstName, lastName } });
}

interface CreateSessionOptions {
  teacherId: number;
  name?: string;
  date?: Date;
  description?: string;
}

export async function createTestSession(opts: CreateSessionOptions) {
  return prisma.session.create({
    data: {
      name: opts.name ?? 'Test Session',
      date: opts.date ?? new Date('2026-09-01'),
      description: opts.description ?? 'Test session description',
      teacherId: opts.teacherId,
    } as Prisma.SessionUncheckedCreateInput,
  });
}
