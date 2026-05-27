import { RequestHandler } from 'express';
import { ZodType } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Valide req.body contre un schéma Zod.
 * En cas d'échec, transmet une AppError 400 décrivant les champs invalides.
 * En cas de succès, remplace req.body par les données validées (et nettoyées).
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const path = issue.path.map(String).join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join(', ');
      next(new AppError(400, message));
      return;
    }

    req.body = result.data;
    next();
  };
}
