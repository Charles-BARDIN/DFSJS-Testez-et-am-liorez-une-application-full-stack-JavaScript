import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import path from 'node:path';

// Exécuté UNE SEULE FOIS avant tous les tests : applique le schéma Prisma à la BDD de test
// (utilise db push pour s'affranchir des migrations locales et garantir un état frais).
// Renvoie une fonction de teardown qui ferme proprement le pool Prisma à la fin du run.
export default async function setup(): Promise<() => Promise<void>> {
  config({ path: path.resolve(__dirname, '../../.env.test') });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set (missing backend/.env.test ?)');
  }

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  });

  return async () => {
    const { prisma } = await import('../prisma');
    await prisma.$disconnect();
  };
}
