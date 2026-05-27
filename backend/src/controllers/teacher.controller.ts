import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../errors/AppError';

const prisma = new PrismaClient();

export class TeacherController {
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    const teachers = await prisma.teacher.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response = teachers.map((teacher) => ({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    }));

    res.status(200).json(response);
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError(400, 'Teacher ID is required');
    }

    const teacherId = parseInt(id);

    if (isNaN(teacherId)) {
      throw new AppError(400, 'Invalid teacher ID');
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new AppError(404, 'Teacher not found');
    }

    res.status(200).json({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    });
  }
}
