/**
 * Toolbar Component Unit Tests
 *
 * Tests the Toolbar component for:
 * - Rendering action buttons
 * - Add column functionality
 * - Form input and submission
 * - Cancel functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from './Toolbar'

describe('Toolbar Component', () => {
  const defaultProps = {
    onAddColumn: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render add column button', () => {
      render(<Toolbar {...defaultProps} />)
      
      expect(screen.getByTestId('add-column-button')).toBeInTheDocument()
    })

    it('should display "Add List" text', () => {
      render(<Toolbar {...defaultProps} />)
      
      expect(screen.getByText('Add List')).toBeInTheDocument()
    })

    it('should render toolbar container', () => {
      render(<Toolbar {...defaultProps} />)
      
      expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    })
  })

  describe('Add Column', () => {
    it('should show input when Add List button clicked', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      const addBtn = screen.getByTestId('add-column-button')
      await user.click(addBtn)
      
      await waitFor(() => {
        expect(screen.getByTestId('new-column-input')).toBeInTheDocument()
      })
    })

    it('should show save and cancel buttons when in add mode', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      expect(screen.getByTestId('save-column-button')).toBeInTheDocument()
      expect(screen.getByTestId('cancel-column-button')).toBeInTheDocument()
    })

    it('should call onAddColumn with title when form submitted', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      await user.type(input, 'New Column')
      
      await user.click(screen.getByTestId('save-column-button'))
      
      await waitFor(() => {
        expect(defaultProps.onAddColumn).toHaveBeenCalledWith('New Column')
      })
    })

    it('should submit form on Enter key', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      await user.type(input, 'New Column{Enter}')
      
      expect(defaultProps.onAddColumn).toHaveBeenCalledWith('New Column')
    })

    it('should not call onAddColumn with empty title', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      await user.click(screen.getByTestId('save-column-button'))
      
      expect(defaultProps.onAddColumn).not.toHaveBeenCalled()
    })

    it('should not call onAddColumn with whitespace only title', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      await user.type(input, '   ')
      await user.click(screen.getByTestId('save-column-button'))
      
      expect(defaultProps.onAddColumn).not.toHaveBeenCalled()
    })

    it('should trim whitespace from column title', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      await user.type(input, '  New Column  ')
      await user.click(screen.getByTestId('save-column-button'))
      
      expect(defaultProps.onAddColumn).toHaveBeenCalledWith('New Column')
    })

    it('should hide form after successful submission', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      await user.type(input, 'New Column')
      await user.click(screen.getByTestId('save-column-button'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('new-column-input')).not.toBeInTheDocument()
      })
    })

    it('should cancel input when Cancel button clicked', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      await user.type(input, 'New Column')
      await user.click(screen.getByTestId('cancel-column-button'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('new-column-input')).not.toBeInTheDocument()
      })
      expect(defaultProps.onAddColumn).not.toHaveBeenCalled()
    })

    it('should show Add List button again after cancel', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      await user.click(screen.getByTestId('cancel-column-button'))
      
      expect(screen.getByTestId('add-column-button')).toBeInTheDocument()
    })

    it('should autofocus input when entering add mode', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      expect(document.activeElement).toBe(input)
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button with text', () => {
      render(<Toolbar {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /add list/i })).toBeInTheDocument()
    })

    it('should have labeled input field', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      const input = screen.getByTestId('new-column-input')
      expect(input).toHaveAttribute('placeholder')
    })

    it('should have accessible save button', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    })

    it('should have accessible cancel button', async () => {
      const user = userEvent.setup()
      render(<Toolbar {...defaultProps} />)
      
      await user.click(screen.getByTestId('add-column-button'))
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })
})
