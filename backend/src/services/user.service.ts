import { User } from '@prisma/client';
import { UserRepository, userRepository } from '../repositories/user.repository';
import { AppError } from '../errors/AppError';
import { UserResponse } from '../types/responses';

function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    admin: user.admin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  constructor(private readonly users: UserRepository = userRepository) {}

  async getById(id: number): Promise<UserResponse> {
    const user = await this.users.findById(id);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return toUserResponse(user);
  }

  async delete(requesterId: number | undefined, targetId: number): Promise<void> {
    if (requesterId !== targetId) {
      throw new AppError(403, 'You can only delete your own account');
    }

    const user = await this.users.findById(targetId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await this.users.delete(targetId);
  }

  async promoteSelfToAdmin(userId: number): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.admin) {
      return toUserResponse(user);
    }

    const updatedUser = await this.users.setAdmin(user.id, true);
    return toUserResponse(updatedUser);
  }
}

export const userService = new UserService();
