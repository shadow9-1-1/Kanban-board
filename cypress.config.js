/**
 * Cypress Configuration
 *
 * This file configures how Cypress runs E2E tests for your application.
 *
 * HOW CYPRESS WORKS:
 * 1. Cypress opens a browser (Chrome, Firefox, or Electron)
 * 2. Visits your running app (baseUrl)
 * 3. Executes test commands that simulate user interactions
 * 4. Assertions verify the app behaves correctly
 *
 * KEY CONCEPTS:
 * - E2E tests run against a RUNNING application
 * - Start your dev server first: npm run dev
 * - Then run Cypress: npm run e2e
 *
 * CONFIGURATION OPTIONS:
 * - baseUrl: Your app's URL (avoids repeating in every test)
 * - viewportWidth/Height: Browser window size
 * - video: Record test runs as videos
 * - screenshotOnRunFailure: Capture screenshots on failure
 */

import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Base URL for your application
    // Cypress will prefix all cy.visit() calls with this
    baseUrl: 'http://localhost:5173',

    // Where Cypress looks for test files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',

    // Where to save support files
    supportFile: 'cypress/support/e2e.js',

    // Viewport dimensions (simulates screen size)
    viewportWidth: 1280,
    viewportHeight: 720,

    // Video recording (disable for faster runs during development)
    video: false,

    // Screenshots on failure
    screenshotOnRunFailure: true,

    // Timeout settings
    defaultCommandTimeout: 10000, // Commands wait up to 10s
    pageLoadTimeout: 30000, // Page loads wait up to 30s

    // Retry failed tests (useful in CI)
    retries: {
      runMode: 2, // Retry twice in CI (cypress run)
      openMode: 0, // No retries in interactive mode (cypress open)
    },

    setupNodeEvents(_on, _config) {
      // Implement node event listeners here
      // Examples: code coverage, database seeding, etc.
    },
  },
})
