import { Teacher } from '@prisma/client';
import { prisma } from '../prisma';

export class TeacherRepository {
  findAll(): Promise<Teacher[]> {
    return prisma.teacher.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: number): Promise<Teacher | null> {
    return prisma.teacher.findUnique({ where: { id } });
  }
}

export const teacherRepository = new TeacherRepository();
