import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders without crashing', () => {
    render(<App />)
    // smoke test - component renders without throwing
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
