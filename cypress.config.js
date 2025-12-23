import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,

    video: false,
    screenshotOnRunFailure: true,

    // Timeout settings
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,

    retries: {
      runMode: 2, 
      openMode: 0,
    },

    setupNodeEvents(_on, _config) {
        
    },
  },
})
