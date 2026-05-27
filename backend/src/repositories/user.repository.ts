import { User } from '@prisma/client';
import { prisma } from '../prisma';

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  admin: boolean;
}

export class UserRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  setAdmin(id: number, admin: boolean): Promise<User> {
    return prisma.user.update({ where: { id }, data: { admin } });
  }

  delete(id: number): Promise<User> {
    return prisma.user.delete({ where: { id } });
  }
}

export const userRepository = new UserRepository();
