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
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('renders without crashing', () => {
    render(<App />)
    // Basic smoke test - component renders without throwing
    expect(document.body).toBeInTheDocument()
  })

  it('displays the header with app title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/kanban board/i)
  })

  it('displays the toolbar with Add List button', () => {
    render(<App />)
    expect(screen.getByTestId('add-column-button')).toBeInTheDocument()
  })

  it('displays the board region', () => {
    render(<App />)
    expect(screen.getByTestId('board')).toBeInTheDocument()
  })

  it('displays default columns', () => {
    render(<App />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
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
