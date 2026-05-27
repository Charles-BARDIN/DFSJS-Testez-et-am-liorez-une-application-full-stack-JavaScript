import { PrismaClient } from '@prisma/client';

/**
 * Instance Prisma partagée par toute l'application (un seul pool de connexions).
 */
export const prisma = new PrismaClient();
