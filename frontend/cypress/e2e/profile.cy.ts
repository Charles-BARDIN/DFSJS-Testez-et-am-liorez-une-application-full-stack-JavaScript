import { AuthBody, setAuth } from '../support/commands';

describe('Profil (E2E)', () => {
  // Comptes jetables créés pendant les tests, nettoyés systématiquement dans afterEach.
  let createdUserId: number | null = null;
  let createdUserToken: string | null = null;

  afterEach(() => {
    if (createdUserId !== null && createdUserToken !== null) {
      cy.request({
        method: 'DELETE',
        url: `/api/user/${createdUserId}`,
        headers: { Authorization: `Bearer ${createdUserToken}` },
        failOnStatusCode: false, // tolère si déjà supprimé par le test (ex : delete account)
      });
      createdUserId = null;
      createdUserToken = null;
    }
  });

  it('affiche les informations de l’utilisateur', () => {
    cy.loginAndVisit('user@test.com', 'test!1234', '/profile');

    cy.contains('My Profile').should('be.visible');
    cy.contains('John').should('be.visible');
    cy.contains('Doe').should('be.visible');
    cy.contains('user@test.com').should('be.visible');
  });

  it('permet la promotion en admin (mode dev)', () => {
    const email = `e2e-promote-${Date.now()}@test.com`;
    cy.request('POST', '/api/auth/register', {
      email,
      password: 'test!1234',
      firstName: 'Promo',
      lastName: 'Test',
    }).then((res) => {
      const auth = res.body as AuthBody;
      createdUserId = auth.id;
      createdUserToken = auth.token;
      cy.visit('/profile', { onBeforeLoad: (win) => setAuth(win, auth) });
      cy.contains('button', 'Promote to Admin').click();
      cy.contains('Administrator').should('be.visible');
    });
  });

  it('supprime le compte de l’utilisateur', () => {
    const email = `e2e-del-${Date.now()}@test.com`;

    cy.request('POST', '/api/auth/register', {
      email,
      password: 'test!1234',
      firstName: 'Del',
      lastName: 'Me',
    }).then((res) => {
      const auth = res.body as AuthBody;
      createdUserId = auth.id;
      createdUserToken = auth.token;
      cy.visit('/profile', { onBeforeLoad: (win) => setAuth(win, auth) });
      cy.contains('My Profile').should('be.visible');
      cy.contains('button', 'Delete Account').click();
      cy.url().should('include', '/login');
    });
  });
});
