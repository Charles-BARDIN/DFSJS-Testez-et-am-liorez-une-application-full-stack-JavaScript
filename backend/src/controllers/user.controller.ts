import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';
import { AppError } from '../errors/AppError';

export class UserController {
  async getById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError(400, 'User ID is required');
    }

    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    const user = await userService.getById(userId);
    res.status(200).json(user);
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError(400, 'User ID is required');
    }

    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    await userService.delete(req.userId, userId);
    res.status(200).json({ message: 'User deleted successfully' });
  }

  async promoteSelfToAdmin(req: AuthRequest, res: Response): Promise<void> {
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    if (!isDev) {
      throw new AppError(403, 'Admin self-promotion is only available in development');
    }

    if (!req.userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await userService.promoteSelfToAdmin(req.userId);
    res.status(200).json(result);
  }
}
