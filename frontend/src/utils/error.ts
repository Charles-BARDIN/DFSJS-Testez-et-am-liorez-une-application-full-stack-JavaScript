import axios from 'axios';

/**
 * Extrait un message d'erreur lisible à partir d'une erreur inconnue.
 * Renvoie le message de l'API s'il s'agit d'une erreur Axios, sinon le message de repli.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}

/**
 * Indique si l'erreur provient de l'annulation d'une requête (AbortController).
 * Permet d'ignorer ces erreurs lors du nettoyage des effets.
 */
export function isRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error);
}
