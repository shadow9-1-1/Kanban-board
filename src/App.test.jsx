/**
 * Example Test File for App Component
 *
 * This demonstrates how to write tests with React Testing Library.
 *
 * TESTING PHILOSOPHY:
 * - Test user behavior, not implementation details
 * - Query by role, label, or text (what users see)
 * - Avoid testing internal state or methods
 *
 * COMMON QUERIES:
 * - getByRole('button', { name: /submit/i }) - Find by ARIA role
 * - getByText(/hello world/i) - Find by text content
 * - getByLabelText(/email/i) - Find form inputs by label
 * - getByTestId('my-element') - Last resort, use data-testid
 *
 * ASYNC QUERIES:
 * - findByRole() - Returns promise, waits for element
 * - waitFor(() => expect(...)) - Wait for assertion to pass
 */

import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Basic smoke test - component renders without throwing
    expect(document.body).toBeInTheDocument()
  })

  it('displays the main heading or content', () => {
    render(<App />)
    // Modify this test based on your actual App content
    // Using getByRole for heading is more reliable
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/vite/i)
  })
})

// Example: Testing a simple component
describe('Example Test Patterns', () => {
  it('demonstrates RTL queries', () => {
    // This is a template - replace with your actual components
    render(<button>Click me</button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
  })
})
