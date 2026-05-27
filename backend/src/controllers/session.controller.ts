import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sessionService } from '../services/session.service';
import { AppError } from '../errors/AppError';

export class SessionController {
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    const sessions = await sessionService.getAll();
    res.status(200).json(sessions);
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError(400, 'Session ID is required');
    }

    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      throw new AppError(400, 'Invalid session ID');
    }

    const session = await sessionService.getById(sessionId);
    res.status(200).json(session);
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    const { name, date, description, teacherId } = req.body;

    if (!name) {
      throw new AppError(400, 'Name is required');
    }
    if (!date) {
      throw new AppError(400, 'Date is required');
    }
    if (!description) {
      throw new AppError(400, 'Description is required');
    }
    if (!teacherId) {
      throw new AppError(400, 'Teacher ID is required');
    }
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const session = await sessionService.create(req.userId, {
      name,
      date,
      description,
      teacherId,
    });
    res.status(201).json(session);
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { name, date, description, teacherId } = req.body;

    if (!id) {
      throw new AppError(400, 'Session ID is required');
    }

    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      throw new AppError(400, 'Invalid session ID');
    }
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const session = await sessionService.update(req.userId, sessionId, {
      name,
      date,
      description,
      teacherId,
    });
    res.status(200).json(session);
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError(400, 'Session ID is required');
    }

    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      throw new AppError(400, 'Invalid session ID');
    }
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized');
    }

    await sessionService.delete(req.userId, sessionId);
    res.status(200).json({ message: 'Session deleted successfully' });
  }

  async participate(req: AuthRequest, res: Response): Promise<void> {
    const { id, userId } = req.params as { id: string; userId: string };

    if (!id) {
      throw new AppError(400, 'Session ID is required');
    }
    if (!userId) {
      throw new AppError(400, 'User ID is required');
    }

    const sessionId = parseInt(id);
    const participantUserId = parseInt(userId);

    if (isNaN(sessionId)) {
      throw new AppError(400, 'Invalid session ID');
    }
    if (isNaN(participantUserId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    await sessionService.participate(sessionId, participantUserId);
    res.status(200).json({ message: 'Successfully joined the session' });
  }

  async unparticipate(req: AuthRequest, res: Response): Promise<void> {
    const { id, userId } = req.params as { id: string; userId: string };

    if (!id) {
      throw new AppError(400, 'Session ID is required');
    }
    if (!userId) {
      throw new AppError(400, 'User ID is required');
    }

    const sessionId = parseInt(id);
    const participantUserId = parseInt(userId);

    if (isNaN(sessionId)) {
      throw new AppError(400, 'Invalid session ID');
    }
    if (isNaN(participantUserId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    await sessionService.unparticipate(sessionId, participantUserId);
    res.status(200).json({ message: 'Successfully left the session' });
  }
}
