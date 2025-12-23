import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardDetailModal from './CardDetailModal'

// Mock the focus trap hook
jest.mock('../hooks/useAccessibility', () => ({
  useFocusTrap: () => ({
    containerRef: { current: null },
  }),
}))

const mockCard = {
  id: 'card-1',
  title: 'Test Card',
  description: 'Test description',
  tags: ['urgent', 'bug'],
  columnId: 'column-1',
  createdAt: '2024-01-15T12:00:00Z',
}

const mockCardMinimal = {
  id: 'card-2',
  title: 'Minimal Card',
  columnId: 'column-1',
}

describe('CardDetailModal', () => {
  let mockOnClose
  let mockOnSave
  let mockOnDelete

  beforeEach(() => {
    mockOnClose = jest.fn()
    mockOnSave = jest.fn()
    mockOnDelete = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Reset body overflow
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('should render modal with card title', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByTestId('card-modal')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Edit Card')).toBeInTheDocument()
    })

    it('should render input fields with card data', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByTestId('card-title-input')).toHaveValue('Test Card')
      expect(screen.getByTestId('card-description-input')).toHaveValue('Test description')
      expect(screen.getByTestId('card-tags-input')).toHaveValue('urgent, bug')
    })

    it('should render card with empty description and tags', () => {
      render(
        <CardDetailModal
          card={mockCardMinimal}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByTestId('card-title-input')).toHaveValue('Minimal Card')
      expect(screen.getByTestId('card-description-input')).toHaveValue('')
      expect(screen.getByTestId('card-tags-input')).toHaveValue('')
    })

    it('should show card ID (truncated)', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/card-1/)).toBeInTheDocument()
    })

    it('should show created date when available', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/Created:/)).toBeInTheDocument()
    })

    it('should prevent body scroll when open', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  describe('Closing Modal', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByTestId('close-modal'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByTestId('cancel-modal'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop clicked', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      // Click the backdrop (first element with bg-black)
      const backdrop = screen.getByTestId('card-modal').querySelector('[aria-hidden="true"]')
      await user.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Editing Fields', () => {
    it('should allow editing title', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')

      expect(titleInput).toHaveValue('New Title')
    })

    it('should allow editing description', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const descInput = screen.getByTestId('card-description-input')
      await user.clear(descInput)
      await user.type(descInput, 'New Description')

      expect(descInput).toHaveValue('New Description')
    })

    it('should allow editing tags', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const tagsInput = screen.getByTestId('card-tags-input')
      await user.clear(tagsInput)
      await user.type(tagsInput, 'feature, design')

      expect(tagsInput).toHaveValue('feature, design')
    })
  })

  describe('Saving Changes', () => {
    it('should call onSave and onClose when save button clicked', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByTestId('save-card-button'))

      expect(mockOnSave).toHaveBeenCalledWith('card-1', {
        title: 'Test Card',
        description: 'Test description',
        tags: ['urgent', 'bug'],
      })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should save edited values', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      const descInput = screen.getByTestId('card-description-input')
      const tagsInput = screen.getByTestId('card-tags-input')

      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      await user.clear(descInput)
      await user.type(descInput, 'Updated Description')

      await user.clear(tagsInput)
      await user.type(tagsInput, 'feature, design')

      await user.click(screen.getByTestId('save-card-button'))

      expect(mockOnSave).toHaveBeenCalledWith('card-1', {
        title: 'Updated Title',
        description: 'Updated Description',
        tags: ['feature', 'design'],
      })
    })

    it('should trim whitespace from values', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      await user.clear(titleInput)
      await user.type(titleInput, '  Padded Title  ')

      await user.click(screen.getByTestId('save-card-button'))

      expect(mockOnSave).toHaveBeenCalledWith('card-1', expect.objectContaining({
        title: 'Padded Title',
      }))
    })

    it('should filter empty tags', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const tagsInput = screen.getByTestId('card-tags-input')
      await user.clear(tagsInput)
      await user.type(tagsInput, 'feature, , , design')

      await user.click(screen.getByTestId('save-card-button'))

      expect(mockOnSave).toHaveBeenCalledWith('card-1', expect.objectContaining({
        tags: ['feature', 'design'],
      }))
    })

    it('should save on Ctrl+Enter', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      await user.click(titleInput)
      await user.keyboard('{Control>}{Enter}{/Control}')

      expect(mockOnSave).toHaveBeenCalled()
    })
  })

  describe('Validation', () => {
    it('should show error for empty title', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      await user.clear(titleInput)
      await user.click(screen.getByTestId('save-card-button'))

      expect(screen.getByText('Title is required')).toBeInTheDocument()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should show error for title less than 2 characters', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      await user.clear(titleInput)
      await user.type(titleInput, 'A')
      await user.click(screen.getByTestId('save-card-button'))

      expect(screen.getByText('Title must be at least 2 characters')).toBeInTheDocument()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should clear error when typing', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      await user.clear(titleInput)
      await user.click(screen.getByTestId('save-card-button'))

      expect(screen.getByText('Title is required')).toBeInTheDocument()

      await user.type(titleInput, 'New')

      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Delete', () => {
    it('should call onDelete and onClose when delete clicked', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      await user.click(screen.getByTestId('delete-card-modal'))

      expect(mockOnDelete).toHaveBeenCalledWith('card-1', 'column-1')
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('should have aria-describedby', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')
    })

    it('should have required indicator for title', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      expect(titleInput).toHaveAttribute('aria-required', 'true')
    })

    it('should have accessible close button', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('should mark invalid field with aria-invalid', async () => {
      const user = userEvent.setup()
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      const titleInput = screen.getByTestId('card-title-input')
      await user.clear(titleInput)
      await user.click(screen.getByTestId('save-card-button'))

      expect(titleInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have tags hint for screen readers', () => {
      render(
        <CardDetailModal
          card={mockCard}
          onClose={mockOnClose}
          onSave={mockOnSave}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/Separate tags with commas/)).toBeInTheDocument()
    })
  })
})
