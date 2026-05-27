import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Middleware d'erreur centralisé : transforme une AppError en réponse HTTP
 * correspondante et renvoie une 500 générique pour toute erreur inattendue.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ message: 'Internal server error' });
}
