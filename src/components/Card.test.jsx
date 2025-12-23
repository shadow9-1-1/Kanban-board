/**
 * Card Component Unit Tests
 *
 * Tests the Card component for:
 * - Rendering card content (title, description, tags)
 * - Accessibility attributes
 * - Click and keyboard interactions
 * - Delete functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card from './Card'

// Mock dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {
      role: 'button',
      tabIndex: 0,
      'aria-roledescription': 'sortable',
      'aria-describedby': '',
      'aria-disabled': false,
    },
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}))

describe('Card Component', () => {
  const defaultCard = {
    id: 'card-1',
    title: 'Test Card Title',
    description: 'Test card description',
    tags: ['urgent', 'bug'],
  }

  const defaultProps = {
    card: defaultCard,
    columnId: 'col-1',
    onClick: jest.fn(),
    onDelete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render card with title', () => {
      render(<Card {...defaultProps} />)
      
      expect(screen.getByText('Test Card Title')).toBeInTheDocument()
    })

    it('should render card description', () => {
      render(<Card {...defaultProps} />)
      
      expect(screen.getByText('Test card description')).toBeInTheDocument()
    })

    it('should render card without description', () => {
      const cardNoDesc = { ...defaultCard, description: '' }
      render(<Card {...defaultProps} card={cardNoDesc} />)
      
      expect(screen.getByText('Test Card Title')).toBeInTheDocument()
    })

    it('should render tags', () => {
      render(<Card {...defaultProps} />)
      
      expect(screen.getByText('urgent')).toBeInTheDocument()
      expect(screen.getByText('bug')).toBeInTheDocument()
    })

    it('should render card without tags', () => {
      const cardNoTags = { ...defaultCard, tags: [] }
      render(<Card {...defaultProps} card={cardNoTags} />)
      
      expect(screen.getByText('Test Card Title')).toBeInTheDocument()
      expect(screen.queryByText('urgent')).not.toBeInTheDocument()
    })

    it('should have correct data-testid', () => {
      render(<Card {...defaultProps} />)
      
      expect(screen.getByTestId('card-card-1')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have drag handle with aria-label', () => {
      render(<Card {...defaultProps} />)
      
      const dragHandle = screen.getByLabelText(`Drag ${defaultCard.title}`)
      expect(dragHandle).toBeInTheDocument()
    })

    it('should have edit button with aria-label', () => {
      render(<Card {...defaultProps} />)
      
      const editButton = screen.getByLabelText(`Edit ${defaultCard.title}`)
      expect(editButton).toBeInTheDocument()
    })

    it('should have delete button with aria-label', () => {
      render(<Card {...defaultProps} />)
      
      const deleteBtn = screen.getByLabelText(`Delete ${defaultCard.title}`)
      expect(deleteBtn).toBeInTheDocument()
    })

    it('should have focusable edit button', () => {
      render(<Card {...defaultProps} />)
      
      const editButton = screen.getByLabelText(`Edit ${defaultCard.title}`)
      expect(editButton).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Click Interactions', () => {
    it('should call onClick when card content clicked', async () => {
      const user = userEvent.setup()
      render(<Card {...defaultProps} />)
      
      const editButton = screen.getByLabelText(`Edit ${defaultCard.title}`)
      await user.click(editButton)
      
      expect(defaultProps.onClick).toHaveBeenCalledWith(defaultCard, 'col-1')
    })

    it('should call onClick on Enter key', () => {
      render(<Card {...defaultProps} />)
      
      const editButton = screen.getByLabelText(`Edit ${defaultCard.title}`)
      fireEvent.keyDown(editButton, { key: 'Enter' })
      
      expect(defaultProps.onClick).toHaveBeenCalledWith(defaultCard, 'col-1')
    })

    it('should call onClick on Space key', () => {
      render(<Card {...defaultProps} />)
      
      const editButton = screen.getByLabelText(`Edit ${defaultCard.title}`)
      fireEvent.keyDown(editButton, { key: ' ' })
      
      expect(defaultProps.onClick).toHaveBeenCalledWith(defaultCard, 'col-1')
    })

    it('should not call onClick on other keys', () => {
      render(<Card {...defaultProps} />)
      
      const editButton = screen.getByLabelText(`Edit ${defaultCard.title}`)
      fireEvent.keyDown(editButton, { key: 'a' })
      
      expect(defaultProps.onClick).not.toHaveBeenCalled()
    })
  })

  describe('Delete Functionality', () => {
    it('should render delete button', () => {
      render(<Card {...defaultProps} />)
      
      const deleteBtn = screen.getByTestId('delete-card-card-1')
      expect(deleteBtn).toBeInTheDocument()
    })

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup()
      render(<Card {...defaultProps} />)
      
      const deleteBtn = screen.getByTestId('delete-card-card-1')
      await user.click(deleteBtn)
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith('card-1', 'col-1')
    })

    it('should stop propagation when delete button clicked', async () => {
      const user = userEvent.setup()
      render(<Card {...defaultProps} />)
      
      const deleteBtn = screen.getByTestId('delete-card-card-1')
      await user.click(deleteBtn)
      
      // onDelete should be called but onClick should NOT be called
      expect(defaultProps.onDelete).toHaveBeenCalled()
      expect(defaultProps.onClick).not.toHaveBeenCalled()
    })
  })

  describe('Tag Colors', () => {
    it('should apply correct color to urgent tag', () => {
      render(<Card {...defaultProps} />)
      
      const urgentTag = screen.getByText('urgent')
      expect(urgentTag).toHaveClass('bg-red-100')
    })

    it('should apply correct color to bug tag', () => {
      render(<Card {...defaultProps} />)
      
      const bugTag = screen.getByText('bug')
      expect(bugTag).toHaveClass('bg-orange-100')
    })

    it('should apply default color to unknown tags', () => {
      const cardWithUnknownTag = { ...defaultCard, tags: ['unknown-tag'] }
      render(<Card {...defaultProps} card={cardWithUnknownTag} />)
      
      const tag = screen.getByText('unknown-tag')
      expect(tag).toHaveClass('bg-gray-100')
    })
  })

  describe('Visual States', () => {
    it('should have shadow on hover (class)', () => {
      render(<Card {...defaultProps} />)
      
      const card = screen.getByTestId('card-card-1')
      expect(card).toHaveClass('hover:shadow-md')
    })

    it('should have border by default', () => {
      render(<Card {...defaultProps} />)
      
      const card = screen.getByTestId('card-card-1')
      expect(card).toHaveClass('border')
    })
  })
})
