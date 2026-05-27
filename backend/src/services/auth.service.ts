import * as bcrypt from 'bcrypt';
import { UserRepository, userRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt.util';
import { AppError } from '../errors/AppError';
import { AuthResponse } from '../types/responses';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AuthService {
  constructor(private readonly users: UserRepository = userRepository) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.users.findByEmail(email);

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      admin: user.admin,
      token: generateToken(user.id),
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const existingUser = await this.users.findByEmail(data.email);

    if (existingUser) {
      throw new AppError(400, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.users.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      admin: false,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      admin: user.admin,
      token: generateToken(user.id),
    };
  }
}

export const authService = new AuthService();
