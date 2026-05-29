import { AuthBody, setAuth } from '../support/commands';

describe('Gestion des sessions (E2E, admin)', () => {
  // Tracking pour cleanup garanti dans afterEach, même en cas d'échec.
  const createdSessionIds: number[] = [];
  const createdSessionNames: string[] = [];

  afterEach(() => {
    if (createdSessionIds.length === 0 && createdSessionNames.length === 0) return;
    cy.apiLogin('yoga@studio.com', 'test!1234').then((auth) => {
      const headers = { Authorization: `Bearer ${auth.token}` };

      createdSessionIds.forEach((id) => {
        cy.request({ method: 'DELETE', url: `/api/session/${id}`, headers, failOnStatusCode: false });
      });
      createdSessionIds.length = 0;

      if (createdSessionNames.length > 0) {
        cy.request({ url: '/api/session', headers }).then((res) => {
          const sessions = (res.body || []) as Array<{ id: number; name: string }>;
          createdSessionNames.forEach((name) => {
            const target = sessions.find((s) => s.name === name);
            if (target) {
              cy.request({
                method: 'DELETE',
                url: `/api/session/${target.id}`,
                headers,
                failOnStatusCode: false,
              });
            }
          });
          createdSessionNames.length = 0;
        });
      }
    });
  });

  const authHeader = (auth: AuthBody) => ({ Authorization: `Bearer ${auth.token}` });

  const createViaApi = (auth: AuthBody, name: string) =>
    cy
      .request({
        method: 'POST',
        url: '/api/session',
        headers: authHeader(auth),
        body: { name, date: '2026-09-01', description: 'Created via API for E2E', teacherId: 1 },
      })
      .its('body.id');

  it('crée une session via le formulaire', () => {
    const name = `E2E Create ${Date.now()}`;
    createdSessionNames.push(name);

    cy.loginAndVisit('yoga@studio.com', 'test!1234', '/sessions/create');
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="date"]').type('2026-09-01');
    cy.get('select[name="teacherId"]').select('Margot Delahaye');
    cy.get('textarea[name="description"]').type('Created by Cypress');
    cy.contains('button', 'Create Session').click();

    cy.url().should('match', /\/sessions$/);
    cy.contains(name).should('be.visible');
  });

  it('affiche une erreur de validation à la création', () => {
    cy.loginAndVisit('yoga@studio.com', 'test!1234', '/sessions/create');
    cy.get('input[name="name"]').type('ab'); // < 3 caractères → rejeté par Zod
    cy.get('input[name="date"]').type('2026-09-01');
    cy.get('select[name="teacherId"]').select('Margot Delahaye');
    cy.get('textarea[name="description"]').type('desc');
    cy.contains('button', 'Create Session').click();

    cy.contains(/name/i).should('be.visible');
    cy.url().should('include', '/sessions/create');
  });

  it('modifie une session existante', () => {
    cy.apiLogin('yoga@studio.com', 'test!1234').then((auth) => {
      createViaApi(auth, `E2E Edit ${Date.now()}`).then((id) => {
        createdSessionIds.push(id as number);

        cy.visit(`/sessions/edit/${id}`, { onBeforeLoad: (win) => setAuth(win, auth) });
        cy.get('input[name="name"]').should('not.have.value', '');
        cy.get('input[name="name"]').clear().type('E2E Edited Name');
        cy.contains('button', 'Update Session').click();

        cy.url().should('match', /\/sessions$/);
        cy.contains('E2E Edited Name').should('be.visible');
      });
    });
  });

  it('supprime une session depuis le détail', () => {
    cy.apiLogin('yoga@studio.com', 'test!1234').then((auth) => {
      createViaApi(auth, `E2E Delete ${Date.now()}`).then((id) => {
        createdSessionIds.push(id as number);

        cy.visit(`/sessions/${id}`, { onBeforeLoad: (win) => setAuth(win, auth) });
        cy.contains('h1', 'E2E Delete').should('be.visible');
        cy.contains('button', 'Delete').click();

        cy.url().should('match', /\/sessions$/);
        cy.contains('E2E Delete').should('not.exist');
      });
    });
  });
});
