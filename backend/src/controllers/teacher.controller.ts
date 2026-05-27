import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { teacherService } from '../services/teacher.service';
import { AppError } from '../errors/AppError';

export class TeacherController {
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    const teachers = await teacherService.getAll();
    res.status(200).json(teachers);
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

    const teacher = await teacherService.getById(teacherId);
    res.status(200).json(teacher);
  }
}
