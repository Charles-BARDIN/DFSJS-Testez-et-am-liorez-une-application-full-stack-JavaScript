import { AuthBody } from '../support/commands';

describe('Authentification (E2E)', () => {
  // Utilisateur jetable créé via le test register, nettoyé systématiquement dans afterEach.
  let createdUserId: number | null = null;
  let createdUserToken: string | null = null;

  afterEach(() => {
    if (createdUserId !== null && createdUserToken !== null) {
      cy.request({
        method: 'DELETE',
        url: `/api/user/${createdUserId}`,
        headers: { Authorization: `Bearer ${createdUserToken}` },
        failOnStatusCode: false,
      });
      createdUserId = null;
      createdUserToken = null;
    }
  });

  it('inscrit un nouvel utilisateur et le connecte', () => {
    const email = `e2e-${Date.now()}@test.com`;
    // On intercepte la réponse pour capter id + token, indispensables au cleanup.
    cy.intercept('POST', '/api/auth/register').as('register');

    cy.visit('/register');
    cy.get('input[name="firstName"]').type('E2E');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('test!1234');
    cy.contains('button', 'Register').click();

    cy.wait('@register').then((interception) => {
      const auth = interception.response?.body as AuthBody;
      createdUserId = auth.id;
      createdUserToken = auth.token;
    });

    cy.url().should('match', /\/sessions$/);
    cy.contains('Yoga Sessions').should('be.visible');
  });

  it('affiche une erreur en cas de mauvais identifiants', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('wrong@studio.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.contains('button', 'Login').click();

    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('connecte un administrateur puis le déconnecte', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('yoga@studio.com');
    cy.get('input[type="password"]').type('test!1234');
    cy.contains('button', 'Login').click();

    cy.url().should('match', /\/sessions$/);

    cy.contains('button', 'Logout').click();
    cy.url().should('include', '/login');
    cy.contains('Login to Yoga Studio').should('be.visible');
  });
});
