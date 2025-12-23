/**
 * Jest Configuration for React Testing Library
 *
 * This configuration tells Jest how to:
 * - Transform JSX code (using Babel)
 * - Handle CSS/asset imports
 * - Find and run test files
 * - Generate coverage reports
 */

export default {
  // Use jsdom to simulate a browser environment
  testEnvironment: 'jsdom',

  // Setup file to run before each test
  // This is where jest-dom matchers are imported
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Transform files with Babel (for JSX support)
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Transform ESM packages that Jest can't handle natively
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],

  // Handle CSS imports in tests
  // identity-obj-proxy returns class names as-is (useful for CSS Modules)
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Mock import.meta.env for Vite compatibility
  globals: {
    'import.meta': {
      env: {
        DEV: false,
        PROD: true,
        MODE: 'test',
      },
    },
  },

  // Where to look for test files
  testMatch: [
    '<rootDir>/src/**/*.test.{js,jsx}',
    '<rootDir>/src/**/*.spec.{js,jsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
  ],

  // Files to ignore
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/cypress/'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx', // Entry point - not testable
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/setupTests.js',
  ],

  // Coverage thresholds (optional - enforces minimum coverage)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
}
