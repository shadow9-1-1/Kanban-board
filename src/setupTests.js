/**
 * Jest Setup File for React Testing Library
 *
 * This file runs before each test file and sets up the testing environment.
 * It imports jest-dom matchers that provide custom assertions for DOM elements.
 *
 * HOW IT WORKS:
 * 1. Jest loads this file before running tests (configured in jest.config.js)
 * 2. @testing-library/jest-dom extends Jest's expect() with DOM-specific matchers
 * 3. The cleanup runs automatically after each test to prevent memory leaks
 *
 * CUSTOM MATCHERS AVAILABLE:
 * - toBeInTheDocument() - Check if element is in the DOM
 * - toHaveTextContent() - Check element's text content
 * - toBeVisible() - Check if element is visible
 * - toBeDisabled() - Check if form element is disabled
 * - toHaveClass() - Check if element has specific CSS class
 * - toHaveAttribute() - Check element's attributes
 * - toHaveStyle() - Check element's inline styles
 * - And many more...
 */

import '@testing-library/jest-dom'

// Optional: Global test utilities
// You can add global mocks or utilities here

// Example: Mock window.matchMedia (needed for some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Example: Mock IntersectionObserver (needed for lazy loading, infinite scroll)
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {
    return null
  }
  unobserve() {
    return null
  }
  disconnect() {
    return null
  }
}
