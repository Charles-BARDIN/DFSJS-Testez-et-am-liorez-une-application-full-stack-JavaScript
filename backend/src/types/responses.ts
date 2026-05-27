/**
 * Formes des réponses renvoyées par l'API (avant sérialisation JSON).
 * Construites par les services à partir des entités Prisma.
 */

export interface TeacherResponse {
  id: number;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionResponse {
  id: number;
  name: string;
  date: Date;
  description: string;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
  users: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  token: string;
}
