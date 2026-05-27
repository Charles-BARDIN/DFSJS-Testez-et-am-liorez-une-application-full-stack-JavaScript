import { Prisma } from '@prisma/client';
import {
  SessionRepository,
  sessionRepository,
  SessionWithRelations,
} from '../repositories/session.repository';
import { UserRepository, userRepository } from '../repositories/user.repository';
import { TeacherRepository, teacherRepository } from '../repositories/teacher.repository';
import { AppError } from '../errors/AppError';
import { SessionResponse } from '../types/responses';

interface CreateSessionInput {
  name: string;
  date: string;
  description: string;
  teacherId: number;
}

interface UpdateSessionInput {
  name?: string;
  date?: string;
  description?: string;
  teacherId?: number;
}

function toSessionResponse(session: SessionWithRelations): SessionResponse {
  return {
    id: session.id,
    name: session.name,
    date: session.date,
    description: session.description,
    teacher: {
      id: session.teacher.id,
      firstName: session.teacher.firstName,
      lastName: session.teacher.lastName,
    },
    users: session.participants.map((participation) => participation.user.id),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export class SessionService {
  constructor(
    private readonly sessions: SessionRepository = sessionRepository,
    private readonly users: UserRepository = userRepository,
    private readonly teachers: TeacherRepository = teacherRepository,
  ) {}

  async getAll(): Promise<SessionResponse[]> {
    const sessions = await this.sessions.findAll();
    return sessions.map(toSessionResponse);
  }

  async getById(id: number): Promise<SessionResponse> {
    const session = await this.sessions.findById(id);

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    return toSessionResponse(session);
  }

  async create(adminUserId: number, data: CreateSessionInput): Promise<SessionResponse> {
    await this.ensureAdmin(adminUserId);
    await this.ensureTeacherExists(data.teacherId);

    const session = await this.sessions.create({
      name: data.name,
      date: new Date(data.date),
      description: data.description,
      teacherId: data.teacherId,
    });

    return toSessionResponse(session);
  }

  async update(
    adminUserId: number,
    id: number,
    data: UpdateSessionInput,
  ): Promise<SessionResponse> {
    await this.ensureAdmin(adminUserId);

    const existingSession = await this.sessions.exists(id);

    if (!existingSession) {
      throw new AppError(404, 'Session not found');
    }

    const updateData: Prisma.SessionUncheckedUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.date) updateData.date = new Date(data.date);
    if (data.description) updateData.description = data.description;
    if (data.teacherId) {
      await this.ensureTeacherExists(data.teacherId);
      updateData.teacherId = data.teacherId;
    }

    const session = await this.sessions.update(id, updateData);
    return toSessionResponse(session);
  }

  async delete(adminUserId: number, id: number): Promise<void> {
    await this.ensureAdmin(adminUserId);

    const existingSession = await this.sessions.exists(id);

    if (!existingSession) {
      throw new AppError(404, 'Session not found');
    }

    await this.sessions.delete(id);
  }

  async participate(sessionId: number, userId: number): Promise<void> {
    const session = await this.sessions.exists(sessionId);

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const existingParticipation = await this.sessions.findParticipation(sessionId, userId);

    if (existingParticipation) {
      throw new AppError(400, 'User already participating in this session');
    }

    await this.sessions.addParticipant(sessionId, userId);
  }

  async unparticipate(sessionId: number, userId: number): Promise<void> {
    const participation = await this.sessions.findParticipation(sessionId, userId);

    if (!participation) {
      throw new AppError(404, 'Participation not found');
    }

    await this.sessions.removeParticipant(sessionId, userId);
  }

  private async ensureAdmin(userId: number): Promise<void> {
    const user = await this.users.findById(userId);

    if (!user || !user.admin) {
      throw new AppError(403, 'Admin access required');
    }
  }

  private async ensureTeacherExists(teacherId: number): Promise<void> {
    const teacher = await this.teachers.findById(teacherId);

    if (!teacher) {
      throw new AppError(404, 'Teacher not found');
    }
  }
}

export const sessionService = new SessionService();
