/**
 * ListColumn Component Unit Tests
 *
 * Tests the ListColumn component for:
 * - Rendering column with cards
 * - Add card functionality
 * - Rename column
 * - Archive column
 * - Card interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ListColumn from './ListColumn'

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}))

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => children,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

// Mock Card component
jest.mock('./Card', () => {
  return function MockCard({ card, columnId, onClick, onDelete }) {
    return (
      <div data-testid={`card-${card.id}`}>
        <span>{card.title}</span>
        <button
          data-testid={`card-click-${card.id}`}
          onClick={() => onClick && onClick(card, columnId)}
        >
          Click
        </button>
        <button
          data-testid={`delete-${card.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete && onDelete(card.id, columnId)
          }}
        >
          Delete
        </button>
      </div>
    )
  }
})

// Mock VirtualizedCardList
jest.mock('./VirtualizedCardList', () => ({
  __esModule: true,
  default: ({ cards }) => (
    <div data-testid="virtualized-list">
      {cards.map((card) => (
        <div key={card.id}>{card.title}</div>
      ))}
    </div>
  ),
  VIRTUALIZATION_THRESHOLD: 30,
}))

describe('ListColumn Component', () => {
  const defaultColumn = {
    id: 'col-1',
    title: 'To Do',
    cardIds: ['card-1', 'card-2'],
  }

  const defaultCards = [
    { id: 'card-1', title: 'Card 1', description: 'Description 1' },
    { id: 'card-2', title: 'Card 2', description: 'Description 2' },
  ]

  const defaultProps = {
    column: defaultColumn,
    cards: defaultCards,
    onRename: jest.fn(),
    onArchive: jest.fn(),
    onAddCard: jest.fn(),
    onCardClick: jest.fn(),
    onDeleteCard: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render column with title', () => {
      render(<ListColumn {...defaultProps} />)
      
      expect(screen.getByTestId(`column-${defaultColumn.id}`)).toBeInTheDocument()
      expect(screen.getByTestId(`column-title-${defaultColumn.id}`)).toHaveTextContent('To Do')
    })

    it('should display card count in title', () => {
      render(<ListColumn {...defaultProps} />)
      
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument()
    })

    it('should render all cards', () => {
      render(<ListColumn {...defaultProps} />)
      
      expect(screen.getByTestId('card-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('card-card-2')).toBeInTheDocument()
    })

    it('should show empty state when no cards', () => {
      render(<ListColumn {...defaultProps} cards={[]} />)
      
      expect(screen.getByText(/no cards yet/i)).toBeInTheDocument()
    })

    it('should show add card button', () => {
      render(<ListColumn {...defaultProps} />)
      
      expect(screen.getByTestId(`add-card-button-${defaultColumn.id}`)).toBeInTheDocument()
    })

    it('should show column menu button', () => {
      render(<ListColumn {...defaultProps} />)
      
      expect(screen.getByTestId(`column-menu-${defaultColumn.id}`)).toBeInTheDocument()
    })
  })

  describe('Add Card', () => {
    it('should show add card form when button clicked', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`add-card-button-${defaultColumn.id}`))
      
      expect(screen.getByTestId(`new-card-input-${defaultColumn.id}`)).toBeInTheDocument()
    })

    it('should call onAddCard when form submitted', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`add-card-button-${defaultColumn.id}`))
      
      const input = screen.getByTestId(`new-card-input-${defaultColumn.id}`)
      await user.type(input, 'New Card Title')
      await user.click(screen.getByTestId(`save-card-${defaultColumn.id}`))
      
      expect(defaultProps.onAddCard).toHaveBeenCalledWith('col-1', { title: 'New Card Title' })
    })

    it('should not call onAddCard with empty title', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`add-card-button-${defaultColumn.id}`))
      await user.click(screen.getByTestId(`save-card-${defaultColumn.id}`))
      
      expect(defaultProps.onAddCard).not.toHaveBeenCalled()
    })

    it('should cancel add card mode', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`add-card-button-${defaultColumn.id}`))
      await user.click(screen.getByTestId(`cancel-card-${defaultColumn.id}`))
      
      expect(screen.queryByTestId(`new-card-input-${defaultColumn.id}`)).not.toBeInTheDocument()
    })
  })

  describe('Rename Column', () => {
    it('should show rename input when title clicked', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`column-title-${defaultColumn.id}`))
      
      expect(screen.getByTestId(`rename-column-input-${defaultColumn.id}`)).toBeInTheDocument()
    })

    it('should call onRename when input blurred with new value', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`column-title-${defaultColumn.id}`))
      
      const input = screen.getByTestId(`rename-column-input-${defaultColumn.id}`)
      await user.clear(input)
      await user.type(input, 'New Title')
      fireEvent.blur(input)
      
      expect(defaultProps.onRename).toHaveBeenCalledWith('col-1', 'New Title')
    })

    it('should call onRename on Enter key', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`column-title-${defaultColumn.id}`))
      
      const input = screen.getByTestId(`rename-column-input-${defaultColumn.id}`)
      await user.clear(input)
      await user.type(input, 'New Title{Enter}')
      
      expect(defaultProps.onRename).toHaveBeenCalledWith('col-1', 'New Title')
    })
  })

  describe('Column Menu', () => {
    it('should show menu when menu button clicked', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`column-menu-${defaultColumn.id}`))
      
      expect(screen.getByText('Rename')).toBeInTheDocument()
      expect(screen.getByText('Archive List')).toBeInTheDocument()
    })

    it('should start rename mode from menu', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`column-menu-${defaultColumn.id}`))
      await user.click(screen.getByTestId(`rename-column-${defaultColumn.id}`))
      
      expect(screen.getByTestId(`rename-column-input-${defaultColumn.id}`)).toBeInTheDocument()
    })

    it('should call onArchive when archive clicked', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId(`column-menu-${defaultColumn.id}`))
      await user.click(screen.getByTestId(`archive-column-${defaultColumn.id}`))
      
      expect(defaultProps.onArchive).toHaveBeenCalledWith('col-1')
    })
  })

  describe('Card Interactions', () => {
    it('should call onCardClick when card clicked', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId('card-click-card-1'))
      
      expect(defaultProps.onCardClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'card-1' }),
        'col-1'
      )
    })

    it('should call onDeleteCard when delete clicked', async () => {
      const user = userEvent.setup()
      render(<ListColumn {...defaultProps} />)
      
      await user.click(screen.getByTestId('delete-card-1'))
      
      expect(defaultProps.onDeleteCard).toHaveBeenCalledWith('card-1', 'col-1')
    })
  })

  describe('Accessibility', () => {
    it('should have column menu button with accessible label', () => {
      render(<ListColumn {...defaultProps} />)
      
      const menuBtn = screen.getByTestId(`column-menu-${defaultColumn.id}`)
      expect(menuBtn).toHaveAttribute('aria-label', 'Column menu')
    })

    it('should have clickable title with tabindex', () => {
      render(<ListColumn {...defaultProps} />)
      
      const title = screen.getByTestId(`column-title-${defaultColumn.id}`)
      expect(title).toHaveAttribute('tabIndex', '0')
    })

    it('should have add card button with accessible text', () => {
      render(<ListColumn {...defaultProps} />)
      
      expect(screen.getByText(/add a card/i)).toBeInTheDocument()
    })
  })
})
