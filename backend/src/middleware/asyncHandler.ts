import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Enveloppe un handler asynchrone : tout rejet de promesse est transmis
 * au middleware d'erreur Express via next(), ce qui évite les try/catch répétés.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
