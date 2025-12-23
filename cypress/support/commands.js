/**
 * Cypress Custom Commands
 * 
 * Custom commands extend Cypress with reusable actions.
 * They help avoid repetition and make tests more readable.
 * 
 * HOW TO CREATE COMMANDS:
 * Cypress.Commands.add('commandName', (arg1, arg2) => {
 *   // Command implementation
 * })
 * 
 * HOW TO USE IN TESTS:
 * cy.commandName(arg1, arg2)
 * 
 * EXAMPLES BELOW:
 * - cy.login(email, password) - Log in a user
 * - cy.getBySel(selector) - Get element by data-testid
 * - cy.createTask(title) - Create a new Kanban task
 */

// Get element by data-testid attribute (recommended for E2E)
// Usage: cy.getBySel('task-card')
Cypress.Commands.add('getBySel', (selector, ...args) => {
  return cy.get(`[data-testid="${selector}"]`, ...args)
})

// Get element by data-cy attribute (alternative)
// Usage: cy.getByDataCy('submit-button')
Cypress.Commands.add('getByDataCy', (selector, ...args) => {
  return cy.get(`[data-cy="${selector}"]`, ...args)
})

// Example: Login command (customize for your auth)
// Usage: cy.login('user@example.com', 'password123')
Cypress.Commands.add('login', (email, password) => {
  // Implement based on your authentication method
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})

// Example: Create a Kanban task (customize for your app)
// Usage: cy.createTask('My New Task')
Cypress.Commands.add('createTask', (title, column = 'todo') => {
  cy.getBySel(`add-task-${column}`).click()
  cy.getBySel('task-title-input').type(title)
  cy.getBySel('save-task-button').click()
  cy.contains(title).should('be.visible')
})

// Example: Drag and drop (for Kanban board)
// Usage: cy.dragTo('task-1', 'done-column')
Cypress.Commands.add('dragTo', (sourceSelector, targetSelector) => {
  cy.getBySel(sourceSelector).drag(`[data-testid="${targetSelector}"]`)
})
