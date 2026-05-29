import { setAuth } from '../support/commands';

describe('Liste des sessions (E2E)', () => {
  // Sessions créées pendant les tests, nettoyées systématiquement dans afterEach.
  const createdSessionIds: number[] = [];

  afterEach(() => {
    if (createdSessionIds.length === 0) return;
    cy.apiLogin('yoga@studio.com', 'test!1234').then((auth) => {
      createdSessionIds.forEach((id) => {
        cy.request({
          method: 'DELETE',
          url: `/api/session/${id}`,
          headers: { Authorization: `Bearer ${auth.token}` },
          failOnStatusCode: false,
        });
      });
      createdSessionIds.length = 0;
    });
  });

  it('affiche la liste et les actions Create/Detail pour un administrateur', () => {
    cy.loginAndVisit('yoga@studio.com', 'test!1234', '/sessions');

    cy.contains('Yoga Sessions').should('be.visible');
    cy.contains('Yoga Vinyasa').should('be.visible');
    cy.contains('a', 'Create Session').should('be.visible');
    cy.contains('View Details').should('be.visible');
    cy.get('button').contains('Delete').should('be.visible');
  });

  it('masque les actions admin pour un utilisateur standard', () => {
    cy.loginAndVisit('user@test.com', 'test!1234', '/sessions');

    cy.contains('Yoga Vinyasa').should('be.visible');
    cy.contains('View Details').should('be.visible');
    cy.contains('Create Session').should('not.exist');
    cy.get('button').contains('Delete').should('not.exist');
  });

  it('supprime une session depuis la liste (admin)', () => {
    cy.apiLogin('yoga@studio.com', 'test!1234').then((auth) => {
      const name = `E2E List Delete ${Date.now()}`;
      cy.request({
        method: 'POST',
        url: '/api/session',
        headers: { Authorization: `Bearer ${auth.token}` },
        body: { name, date: '2026-09-15', description: 'created for list-delete', teacherId: 1 },
      }).then((res) => {
        createdSessionIds.push(res.body.id as number);
        cy.visit('/sessions', { onBeforeLoad: (win) => setAuth(win, auth) });
        cy.contains('h3', name).should('be.visible');
        cy.contains('h3', name).closest('.bg-white').contains('button', 'Delete').click();
        cy.contains(name).should('not.exist');
      });
    });
  });

  it('affiche une erreur si le chargement échoue', () => {
    cy.apiLogin('user@test.com', 'test!1234').then((auth) => {
      cy.intercept('GET', '/api/session', { statusCode: 500, body: {} }).as('getSessions');
      cy.visit('/sessions', { onBeforeLoad: (win) => setAuth(win, auth) });
      cy.wait('@getSessions');
      cy.contains('Failed to load sessions').should('be.visible');
    });
  });
});
