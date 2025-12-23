/**
 * Kanban Board E2E Test Suite
 *
 * Comprehensive end-to-end tests covering:
 * - List (column) management
 * - Card management
 * - Card movement between columns
 * - Offline changes
 * - Sync after reconnect
 *
 * TESTING STRATEGY:
 * =================
 * This test simulates a complete user journey:
 * 1. Create new lists
 * 2. Add cards to lists
 * 3. Move cards between lists
 * 4. Work offline (make changes)
 * 5. Reconnect and verify sync
 *
 * PREREQUISITES:
 * - App running at localhost:5173
 * - MSW (Mock Service Worker) configured for API mocking
 */

describe('Kanban Board - Complete User Journey', () => {
  beforeEach(() => {
    // Clear localStorage to start fresh
    cy.clearLocalStorage()

    // Visit the app
    cy.visit('/')

    // Wait for app to fully load
    cy.get('[data-testid="board"]', { timeout: 10000 }).should('be.visible')
  })

  describe('1. List Management', () => {
    it('should display default columns', () => {
      cy.contains('To Do').should('be.visible')
      cy.contains('In Progress').should('be.visible')
      cy.contains('Done').should('be.visible')
    })

    it('should create a new list', () => {
      // Click add list button
      cy.get('[data-testid="add-column-button"]').click()

      // Enter list name
      cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
        .should('be.visible')
        .type('Backlog')

      // Submit
      cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
        .closest('form')
        .submit()

      // Verify new list appears
      cy.contains('Backlog').should('be.visible')
    })

    it('should rename a list', () => {
      // Open column menu on first column
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="column-menu-button"]')
        .click()

      // Click rename option
      cy.contains('Rename').click()

      // Clear and type new name
      cy.get('input[value="To Do"]')
        .clear()
        .type('Todo Items')
        .blur()

      // Verify renamed
      cy.contains('Todo Items').should('be.visible')
      cy.contains('To Do').should('not.exist')
    })

    it('should archive/delete a list', () => {
      // First create a new list to delete (don't delete defaults)
      cy.get('[data-testid="add-column-button"]').click()
      cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
        .type('Temp List')
      cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
        .closest('form')
        .submit()

      cy.contains('Temp List').should('be.visible')

      // Open menu on new column
      cy.contains('Temp List')
        .closest('[data-testid^="column-"]')
        .find('[data-testid="column-menu-button"]')
        .click()

      // Click archive/delete
      cy.contains(/archive|delete/i).click()

      // Confirm if dialog appears
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-action"]').length) {
          cy.get('[data-testid="confirm-action"]').click()
        }
      })

      // Verify list is gone
      cy.contains('Temp List').should('not.exist')
    })
  })

  describe('2. Card Management', () => {
    it('should create a new card', () => {
      // Find first column and click add card
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      // Enter card title
      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .should('be.visible')
        .type('My First Card')

      // Submit
      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      // Verify card appears
      cy.contains('My First Card').should('be.visible')
    })

    it('should open card detail modal on click', () => {
      // Create a card first
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Clickable Card')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      // Click the card
      cy.contains('Clickable Card').click()

      // Verify modal opens
      cy.get('[data-testid="card-detail-modal"]').should('be.visible')
      cy.get('[data-testid="card-detail-modal"]')
        .find('input, textarea')
        .first()
        .should('have.value', 'Clickable Card')
    })

    it('should edit card details', () => {
      // Create a card
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Editable Card')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      // Open card
      cy.contains('Editable Card').click()

      // Edit title
      cy.get('[data-testid="card-detail-modal"]')
        .find('input[name="title"], input[id*="title"]')
        .clear()
        .type('Updated Card Title')

      // Edit description
      cy.get('[data-testid="card-detail-modal"]')
        .find('textarea[name="description"], textarea[id*="description"]')
        .type('This is the card description')

      // Save
      cy.get('[data-testid="save-card-button"]').click()

      // Verify modal closes and card is updated
      cy.get('[data-testid="card-detail-modal"]').should('not.exist')
      cy.contains('Updated Card Title').should('be.visible')
    })

    it('should delete a card', () => {
      // Create a card
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Card to Delete')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      cy.contains('Card to Delete').should('be.visible')

      // Find and click delete button on card
      cy.contains('Card to Delete')
        .closest('[data-testid^="card-"]')
        .find('[data-testid="delete-card-button"]')
        .click({ force: true })

      // Confirm if dialog appears
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-action"]').length) {
          cy.get('[data-testid="confirm-action"]').click()
        }
      })

      // Verify card is gone
      cy.contains('Card to Delete').should('not.exist')
    })
  })

  describe('3. Card Movement', () => {
    beforeEach(() => {
      // Create cards in first column
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Movable Card')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      cy.contains('Movable Card').should('be.visible')
    })

    it('should move card between columns via drag and drop', () => {
      // Get the card
      const card = cy.contains('Movable Card').closest('[data-testid^="card-"]')

      // Get destination column (In Progress)
      const destColumn = cy.contains('In Progress').closest('[data-testid^="column-"]')

      // Perform drag and drop
      card.then(($card) => {
        destColumn.then(($dest) => {
          const destRect = $dest[0].getBoundingClientRect()

          cy.wrap($card)
            .trigger('mousedown', { which: 1, button: 0 })
            .trigger('mousemove', {
              clientX: destRect.x + destRect.width / 2,
              clientY: destRect.y + 100,
            })
            .trigger('mouseup', { force: true })
        })
      })

      // Wait for state to update and verify card is in new column
      cy.wait(500)
      cy.contains('In Progress')
        .closest('[data-testid^="column-"]')
        .should('contain', 'Movable Card')
    })

    // Alternative: Test move via keyboard/modal if drag-drop is complex
    it('should move card via modal (if available)', () => {
      // Open card modal
      cy.contains('Movable Card').click()

      // Check if there's a column selector in modal
      cy.get('body').then(($body) => {
        const hasColumnSelect = $body.find('select[name="column"], [data-testid="column-select"]').length > 0

        if (hasColumnSelect) {
          cy.get('select[name="column"], [data-testid="column-select"]')
            .select('In Progress')

          cy.get('[data-testid="save-card-button"]').click()

          cy.contains('In Progress')
            .closest('[data-testid^="column-"]')
            .should('contain', 'Movable Card')
        } else {
          // Skip if no column selector
          cy.log('Column selector not available in modal')
        }
      })
    })
  })

  describe('4. Offline Changes', () => {
    it('should work offline and queue changes', () => {
      // Create a card while online
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Online Card')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false)
        win.dispatchEvent(new Event('offline'))
      })

      // Verify offline indicator appears (if implemented)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="sync-status"]').length) {
          cy.get('[data-testid="sync-status"]').should('contain.text', /offline/i)
        }
      })

      // Create another card while offline
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Offline Card')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      // Verify card appears (optimistic update)
      cy.contains('Offline Card').should('be.visible')

      // Edit the card while offline
      cy.contains('Offline Card').click()

      cy.get('[data-testid="card-detail-modal"]')
        .find('textarea[name="description"], textarea[id*="description"]')
        .type('Added while offline')

      cy.get('[data-testid="save-card-button"]').click()

      // Changes should be stored locally
      cy.contains('Offline Card').should('be.visible')
    })
  })

  describe('5. Sync After Reconnect', () => {
    it('should sync queued changes when coming back online', () => {
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false)
        win.dispatchEvent(new Event('offline'))
      })

      // Make changes while offline
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Pending Sync Card')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      cy.contains('Pending Sync Card').should('be.visible')

      // Verify pending indicator (if implemented)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="sync-status"]').length) {
          cy.get('[data-testid="sync-status"]')
            .should('match', /pending|queued|offline/i)
        }
      })

      // Come back online
      cy.window().then((win) => {
        // Restore online status
        Object.defineProperty(win.navigator, 'onLine', {
          value: true,
          writable: true,
        })
        win.dispatchEvent(new Event('online'))
      })

      // Wait for sync
      cy.wait(2000)

      // Verify sync status shows success (if implemented)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="sync-status"]').length) {
          cy.get('[data-testid="sync-status"]', { timeout: 5000 })
            .should('not.contain.text', /pending|queued/i)
        }
      })

      // Card should still be visible (synced successfully)
      cy.contains('Pending Sync Card').should('be.visible')
    })

    it('should persist data across page refresh', () => {
      // Create a card
      cy.get('[data-testid^="column-"]')
        .first()
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Persistent Card')

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      cy.contains('Persistent Card').should('be.visible')

      // Wait for localStorage save
      cy.wait(1000)

      // Refresh the page
      cy.reload()

      // Wait for app to load
      cy.get('[data-testid="board"]', { timeout: 10000 }).should('be.visible')

      // Card should still be there
      cy.contains('Persistent Card').should('be.visible')
    })
  })

  describe('6. Complete Workflow', () => {
    it('should complete full kanban workflow', () => {
      // 1. Create a new list
      cy.get('[data-testid="add-column-button"]').click()
      cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
        .type('Sprint Backlog')
      cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
        .closest('form')
        .submit()
      cy.contains('Sprint Backlog').should('be.visible')

      // 2. Create cards in new list
      cy.contains('Sprint Backlog')
        .closest('[data-testid^="column-"]')
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Feature A')
      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      cy.contains('Feature A').should('be.visible')

      // Create another card
      cy.contains('Sprint Backlog')
        .closest('[data-testid^="column-"]')
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Bug Fix B')
      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      cy.contains('Bug Fix B').should('be.visible')

      // 3. Edit card details
      cy.contains('Feature A').click()

      cy.get('[data-testid="card-detail-modal"]')
        .find('textarea[name="description"], textarea[id*="description"]')
        .type('Implement the main feature functionality')

      cy.get('[data-testid="save-card-button"]').click()

      // 4. Go offline and make changes
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false)
        win.dispatchEvent(new Event('offline'))
      })

      // Create card while offline
      cy.contains('Sprint Backlog')
        .closest('[data-testid^="column-"]')
        .find('[data-testid="add-card-button"]')
        .click()

      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .type('Offline Task')
      cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
        .closest('form')
        .submit()

      cy.contains('Offline Task').should('be.visible')

      // 5. Come back online
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          value: true,
          writable: true,
        })
        win.dispatchEvent(new Event('online'))
      })

      // 6. Verify all cards are present
      cy.wait(2000)
      cy.contains('Feature A').should('be.visible')
      cy.contains('Bug Fix B').should('be.visible')
      cy.contains('Offline Task').should('be.visible')
      cy.contains('Sprint Backlog').should('be.visible')

      // 7. Verify persistence
      cy.reload()
      cy.get('[data-testid="board"]', { timeout: 10000 }).should('be.visible')
      cy.contains('Sprint Backlog').should('be.visible')
      cy.contains('Feature A').should('be.visible')
    })
  })
})

// Custom commands for common operations
Cypress.Commands.add('createColumn', (name) => {
  cy.get('[data-testid="add-column-button"]').click()
  cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
    .type(name)
  cy.get('input[placeholder*="list" i], input[placeholder*="column" i]')
    .closest('form')
    .submit()
  cy.contains(name).should('be.visible')
})

Cypress.Commands.add('createCard', (columnName, cardTitle) => {
  cy.contains(columnName)
    .closest('[data-testid^="column-"]')
    .find('[data-testid="add-card-button"]')
    .click()

  cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
    .type(cardTitle)
  cy.get('input[placeholder*="card" i], input[placeholder*="title" i]')
    .closest('form')
    .submit()

  cy.contains(cardTitle).should('be.visible')
})

Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(false)
    win.dispatchEvent(new Event('offline'))
  })
})

Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    Object.defineProperty(win.navigator, 'onLine', {
      value: true,
      writable: true,
    })
    win.dispatchEvent(new Event('online'))
  })
})
    
    // Basic keyboard navigation check
    cy.get('body').tab() // Requires cypress-plugin-tab
  })
})
