/// <reference types="cypress" />

export interface AuthBody {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  token: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Connexion via l'API, renvoie le corps de la réponse (token + utilisateur). */
      apiLogin(email: string, password: string): Chainable<AuthBody>;
      /** Connexion programmatique puis visite de `path` avec le token déjà en place. */
      loginAndVisit(email: string, password: string, path: string): Chainable<void>;
    }
  }
}

export function setAuth(win: Window, auth: AuthBody): void {
  win.localStorage.setItem('token', auth.token);
  win.localStorage.setItem('user', JSON.stringify(auth));
}

Cypress.Commands.add('apiLogin', (email: string, password: string) => {
  return cy
    .request('POST', '/api/auth/login', { email, password })
    .its('body') as Cypress.Chainable<AuthBody>;
});

Cypress.Commands.add('loginAndVisit', (email: string, password: string, path: string) => {
  cy.apiLogin(email, password).then((auth) => {
    cy.visit(path, {
      onBeforeLoad(win) {
        setAuth(win, auth);
      },
    });
  });
});
