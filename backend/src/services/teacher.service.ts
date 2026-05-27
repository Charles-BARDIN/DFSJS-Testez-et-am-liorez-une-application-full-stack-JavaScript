import { Teacher } from '@prisma/client';
import { TeacherRepository, teacherRepository } from '../repositories/teacher.repository';
import { AppError } from '../errors/AppError';
import { TeacherResponse } from '../types/responses';

function toTeacherResponse(teacher: Teacher): TeacherResponse {
  return {
    id: teacher.id,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
  };
}

export class TeacherService {
  constructor(private readonly teachers: TeacherRepository = teacherRepository) {}

  async getAll(): Promise<TeacherResponse[]> {
    const teachers = await this.teachers.findAll();
    return teachers.map(toTeacherResponse);
  }

  async getById(id: number): Promise<TeacherResponse> {
    const teacher = await this.teachers.findById(id);

    if (!teacher) {
      throw new AppError(404, 'Teacher not found');
    }

    return toTeacherResponse(teacher);
  }
}

export const teacherService = new TeacherService();
