/**
 * Erreur applicative portant un code de statut HTTP.
 * Levée depuis les controllers/services et formatée par le middleware d'erreur.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
