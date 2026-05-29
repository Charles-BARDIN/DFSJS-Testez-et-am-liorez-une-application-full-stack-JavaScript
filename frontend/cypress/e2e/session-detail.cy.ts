import { setAuth } from '../support/commands';

describe('Détail de session (E2E)', () => {
  it('affiche les informations et permet de rejoindre puis quitter', () => {
    cy.loginAndVisit('user@test.com', 'test!1234', '/sessions/1');

    cy.contains('h1', 'Yoga Vinyasa').should('be.visible');
    cy.contains('Margot Delahaye').should('be.visible');
    cy.contains('Description').should('be.visible');

    cy.contains('button', 'Join Session').click();
    cy.contains('button', 'Leave Session').should('be.visible');

    cy.contains('button', 'Leave Session').click();
    cy.contains('button', 'Join Session').should('be.visible');
  });

  it('affiche les boutons Edit et Delete pour un administrateur', () => {
    cy.loginAndVisit('yoga@studio.com', 'test!1234', '/sessions/1');

    cy.contains('button', 'Edit').should('be.visible');
    cy.contains('button', 'Delete').should('be.visible');
  });

  it('affiche une erreur si le chargement échoue', () => {
    cy.apiLogin('user@test.com', 'test!1234').then((auth) => {
      cy.intercept('GET', '/api/session/1', { statusCode: 500, body: {} }).as('getSession');
      cy.visit('/sessions/1', { onBeforeLoad: (win) => setAuth(win, auth) });
      cy.wait('@getSession');
      cy.contains('Failed to load session details').should('be.visible');
    });
  });
});
