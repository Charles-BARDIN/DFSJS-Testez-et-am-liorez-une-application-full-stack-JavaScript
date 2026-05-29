import { config } from 'dotenv';
import path from 'node:path';

// Charge .env.test pour que DATABASE_URL/JWT_SECRET pointent sur le conteneur de test
// AVANT que les modules de test n'importent prisma ou jwt.util.
config({ path: path.resolve(__dirname, '../../.env.test') });
