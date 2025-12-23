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
    '!src/mocks/**', // MSW mocks are not unit testable
    '!src/**/index.js', // Re-export files
  ],

  // Coverage thresholds
  // Global threshold set to achievable level for current codebase
  // Some files (ConflictResolutionModal, VirtualizedCardList, useAccessibility)
  // have complex implementations that are better tested via E2E tests
  coverageThreshold: {
    global: {
      branches: 24,
      functions: 42,
      lines: 45,
      statements: 45,
    },
    // Enforce high coverage on critical, tested files
    'src/context/boardReducer.js': {
      branches: 80,
      functions: 100,
      lines: 90,
      statements: 90,
    },
    'src/hooks/useBoard.js': {
      branches: 80,
      functions: 100,
      lines: 90,
      statements: 90,
    },
    'src/hooks/useOfflineSync.js': {
      branches: 70,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    'src/components/Toolbar.jsx': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'src/components/CardDetailModal.jsx': {
      branches: 90,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    'src/services/api.js': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
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
