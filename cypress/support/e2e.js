/**
 * Cypress E2E Support File
 * 
 * This file runs before every E2E test file.
 * Use it to:
 * - Import custom commands
 * - Set up global configurations
 * - Add global before/after hooks
 * 
 * HOW TO USE:
 * - Add custom commands in commands.js
 * - Import third-party plugins here
 * - Configure global behavior
 */

// Import custom commands
import './commands'

// Prevent Cypress from failing tests on uncaught exceptions
// Remove this if you want to catch app errors in tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the error from failing the test
  // Only do this for known, non-critical errors
  return false
})

// Example: Log test name before each test (helpful for debugging)
beforeEach(() => {
  cy.log(`Running: ${Cypress.currentTest.title}`)
})
