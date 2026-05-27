import { Prisma, Session, SessionParticipation } from '@prisma/client';
import { prisma } from '../prisma';

const sessionInclude = {
  teacher: true,
  participants: {
    include: {
      user: true,
    },
  },
} satisfies Prisma.SessionInclude;

export type SessionWithRelations = Prisma.SessionGetPayload<{
  include: typeof sessionInclude;
}>;

interface CreateSessionData {
  name: string;
  date: Date;
  description: string;
  teacherId: number;
}

export class SessionRepository {
  findAll(): Promise<SessionWithRelations[]> {
    return prisma.session.findMany({ include: sessionInclude });
  }

  findById(id: number): Promise<SessionWithRelations | null> {
    return prisma.session.findUnique({ where: { id }, include: sessionInclude });
  }

  exists(id: number): Promise<Session | null> {
    return prisma.session.findUnique({ where: { id } });
  }

  create(data: CreateSessionData): Promise<SessionWithRelations> {
    return prisma.session.create({ data, include: sessionInclude });
  }

  update(id: number, data: Prisma.SessionUncheckedUpdateInput): Promise<SessionWithRelations> {
    return prisma.session.update({ where: { id }, data, include: sessionInclude });
  }

  delete(id: number): Promise<Session> {
    return prisma.session.delete({ where: { id } });
  }

  findParticipation(sessionId: number, userId: number): Promise<SessionParticipation | null> {
    return prisma.sessionParticipation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
  }

  addParticipant(sessionId: number, userId: number): Promise<SessionParticipation> {
    return prisma.sessionParticipation.create({
      data: { sessionId, userId },
    });
  }

  removeParticipant(sessionId: number, userId: number): Promise<SessionParticipation> {
    return prisma.sessionParticipation.delete({
      where: { sessionId_userId: { sessionId, userId } },
    });
  }
}

export const sessionRepository = new SessionRepository();
