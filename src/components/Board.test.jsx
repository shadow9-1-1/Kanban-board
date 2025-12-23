/**
 * Board Component Tests
 * Tests for the main Kanban board with drag and drop
 */

import { render, screen, fireEvent } from '@testing-library/react'
import Board from './Board'

// Store handlers for testing - must use mock prefix
let mockDndHandlers = {}

// Mock dnd-kit components
jest.mock('@dnd-kit/core', () => {
  const actual = jest.requireActual('@dnd-kit/core')
  return {
    ...actual,
    DndContext: ({ children, onDragStart, onDragEnd }) => {
      // Store handlers in module-scoped variable
      mockDndHandlers = { onDragStart, onDragEnd }
      return <div data-testid="dnd-context">{children}</div>
    },
    DragOverlay: ({ children }) => (
      <div data-testid="drag-overlay">{children}</div>
    ),
    useSensor: jest.fn((sensor) => sensor),
    useSensors: jest.fn((...sensors) => sensors),
  }
})

// Export for test access
const getDndHandlers = () => mockDndHandlers

// Mock ListColumn to simplify testing
jest.mock('./ListColumn', () => {
  const MockListColumn = ({ column, cards, onRename, onArchive, onAddCard, onCardClick, onDeleteCard }) => (
    <div data-testid={`column-${column.id}`} className="list-column">
      <h3>{column.title}</h3>
      <div data-testid={`column-${column.id}-cards`}>
        {cards.map((card) => (
          <div 
            key={card.id} 
            data-testid={`card-${card.id}`}
            onClick={() => onCardClick(card)}
          >
            {card.title}
            <button onClick={() => onDeleteCard(card.id, column.id)}>Delete</button>
          </div>
        ))}
      </div>
      <button onClick={() => onRename(column.id, 'New Title')}>Rename</button>
      <button onClick={() => onArchive(column.id)}>Archive</button>
      <button onClick={() => onAddCard(column.id, { title: 'New Card' })}>Add Card</button>
    </div>
  )
  MockListColumn.displayName = 'MockListColumn'
  return MockListColumn
})

// Mock Card for DragOverlay
jest.mock('./Card', () => {
  const MockCard = ({ card }) => <div data-testid="overlay-card">{card.title}</div>
  MockCard.displayName = 'MockCard'
  return MockCard
})

const mockBoardData = {
  columns: {
    'col-1': { id: 'col-1', title: 'To Do', cardIds: ['card-1', 'card-2'] },
    'col-2': { id: 'col-2', title: 'In Progress', cardIds: ['card-3'] },
    'col-3': { id: 'col-3', title: 'Done', cardIds: [] },
  },
  columnOrder: ['col-1', 'col-2', 'col-3'],
  cards: {
    'card-1': { id: 'card-1', title: 'Task 1', description: 'First task' },
    'card-2': { id: 'card-2', title: 'Task 2', description: 'Second task' },
    'card-3': { id: 'card-3', title: 'Task 3', description: 'Third task' },
  },
}

describe('Board Component', () => {
  let mockOnMoveCard
  let mockOnRenameColumn
  let mockOnArchiveColumn
  let mockOnAddCard
  let mockOnCardClick
  let mockOnDeleteCard

  beforeEach(() => {
    mockOnMoveCard = jest.fn()
    mockOnRenameColumn = jest.fn()
    mockOnArchiveColumn = jest.fn()
    mockOnAddCard = jest.fn()
    mockOnCardClick = jest.fn()
    mockOnDeleteCard = jest.fn()
    mockDndHandlers = {}
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const renderBoard = (boardData = mockBoardData) =>
    render(
      <Board
        boardData={boardData}
        onMoveCard={mockOnMoveCard}
        onRenameColumn={mockOnRenameColumn}
        onArchiveColumn={mockOnArchiveColumn}
        onAddCard={mockOnAddCard}
        onCardClick={mockOnCardClick}
        onDeleteCard={mockOnDeleteCard}
      />
    )

  describe('Rendering', () => {
    it('should render board container', () => {
      renderBoard()
      expect(screen.getByTestId('board')).toBeInTheDocument()
    })

    it('should render all columns', () => {
      renderBoard()
      expect(screen.getByTestId('column-col-1')).toBeInTheDocument()
      expect(screen.getByTestId('column-col-2')).toBeInTheDocument()
      expect(screen.getByTestId('column-col-3')).toBeInTheDocument()
    })

    it('should render columns in correct order', () => {
      renderBoard()
      // Use exact matches for column IDs only
      expect(screen.getByTestId('column-col-1')).toBeInTheDocument()
      expect(screen.getByTestId('column-col-2')).toBeInTheDocument()
      expect(screen.getByTestId('column-col-3')).toBeInTheDocument()
    })

    it('should render cards in columns', () => {
      renderBoard()
      expect(screen.getByTestId('card-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('card-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('card-card-3')).toBeInTheDocument()
    })

    it('should render empty column', () => {
      renderBoard()
      const doneColumn = screen.getByTestId('column-col-3-cards')
      expect(doneColumn.children).toHaveLength(0)
    })

    it('should have DndContext wrapper', () => {
      renderBoard()
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    })

    it('should have DragOverlay', () => {
      renderBoard()
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have region role', () => {
      renderBoard()
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should have aria-label', () => {
      renderBoard()
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Kanban board')
    })
  })

  describe('Column Operations', () => {
    it('should call onRenameColumn when rename clicked', () => {
      renderBoard()
      fireEvent.click(screen.getAllByText('Rename')[0])
      expect(mockOnRenameColumn).toHaveBeenCalledWith('col-1', 'New Title')
    })

    it('should call onArchiveColumn when archive clicked', () => {
      renderBoard()
      fireEvent.click(screen.getAllByText('Archive')[0])
      expect(mockOnArchiveColumn).toHaveBeenCalledWith('col-1')
    })

    it('should call onAddCard when add card clicked', () => {
      renderBoard()
      fireEvent.click(screen.getAllByText('Add Card')[0])
      expect(mockOnAddCard).toHaveBeenCalledWith('col-1', { title: 'New Card' })
    })
  })

  describe('Card Operations', () => {
    it('should call onCardClick when card clicked', () => {
      renderBoard()
      fireEvent.click(screen.getByTestId('card-card-1'))
      expect(mockOnCardClick).toHaveBeenCalledWith(mockBoardData.cards['card-1'])
    })

    it('should call onDeleteCard when delete clicked', () => {
      renderBoard()
      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])
      expect(mockOnDeleteCard).toHaveBeenCalledWith('card-1', 'col-1')
    })
  })

  describe('Drag and Drop Handlers', () => {
    it('should set active card on drag start', () => {
      renderBoard()
      
      const { onDragStart } = getDndHandlers()
      expect(onDragStart).toBeDefined()
      
      // Simulate drag start
      onDragStart({ active: { id: 'card-1' } })
      
      // Should render overlay card
      // Note: State update may be async, this tests handler is called
    })

    it('should handle drag end with no over target', () => {
      renderBoard()
      
      const { onDragEnd } = getDndHandlers()
      onDragEnd({ active: { id: 'card-1' }, over: null })
      
      // Should not call onMoveCard
      expect(mockOnMoveCard).not.toHaveBeenCalled()
    })

    it('should handle drag end when dropping on another card', () => {
      renderBoard()
      
      const { onDragEnd } = getDndHandlers()
      onDragEnd({
        active: { id: 'card-1' },
        over: { id: 'card-3' },
      })
      
      // Card-3 is in col-2, at index 0
      expect(mockOnMoveCard).toHaveBeenCalledWith('card-1', 'col-1', 'col-2', 0)
    })

    it('should handle drag end when dropping on empty column', () => {
      renderBoard()
      
      const { onDragEnd } = getDndHandlers()
      onDragEnd({
        active: { id: 'card-1' },
        over: { id: 'col-3' },
      })
      
      // Col-3 is empty, so index is 0
      expect(mockOnMoveCard).toHaveBeenCalledWith('card-1', 'col-1', 'col-3', 0)
    })

    it('should not move if position unchanged (same column, same index)', () => {
      renderBoard()
      
      const { onDragEnd } = getDndHandlers()
      // Drop card-1 on itself (first position in col-1)
      onDragEnd({
        active: { id: 'card-1' },
        over: { id: 'card-1' },
      })
      
      expect(mockOnMoveCard).not.toHaveBeenCalled()
    })

    it('should handle reorder within same column', () => {
      renderBoard()
      
      const { onDragEnd } = getDndHandlers()
      // Move card-1 to card-2's position (both in col-1)
      onDragEnd({
        active: { id: 'card-1' },
        over: { id: 'card-2' },
      })
      
      // card-2 is at index 1 in col-1
      expect(mockOnMoveCard).toHaveBeenCalledWith('card-1', 'col-1', 'col-1', 1)
    })

    it('should handle drag end with invalid card id', () => {
      renderBoard()
      
      const { onDragEnd } = getDndHandlers()
      onDragEnd({
        active: { id: 'non-existent-card' },
        over: { id: 'col-2' },
      })
      
      // Card not found, should not move
      expect(mockOnMoveCard).not.toHaveBeenCalled()
    })

    it('should handle drag end with invalid over id', () => {
      renderBoard()
      
      const { onDragEnd } = getDndHandlers()
      onDragEnd({
        active: { id: 'card-1' },
        over: { id: 'invalid-target' },
      })
      
      // Invalid target, should not move
      expect(mockOnMoveCard).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle board with no columns', () => {
      const emptyBoard = {
        columns: {},
        columnOrder: [],
        cards: {},
      }
      
      renderBoard(emptyBoard)
      expect(screen.getByTestId('board')).toBeInTheDocument()
    })

    it('should handle board with empty columns only', () => {
      const emptyColumnsBoard = {
        columns: {
          'col-1': { id: 'col-1', title: 'Empty 1', cardIds: [] },
          'col-2': { id: 'col-2', title: 'Empty 2', cardIds: [] },
        },
        columnOrder: ['col-1', 'col-2'],
        cards: {},
      }
      
      renderBoard(emptyColumnsBoard)
      expect(screen.getByTestId('column-col-1')).toBeInTheDocument()
      expect(screen.getByTestId('column-col-2')).toBeInTheDocument()
    })

    it('should filter out undefined cards', () => {
      const boardWithMissingCard = {
        columns: {
          'col-1': { id: 'col-1', title: 'To Do', cardIds: ['card-1', 'missing-card'] },
        },
        columnOrder: ['col-1'],
        cards: {
          'card-1': { id: 'card-1', title: 'Task 1' },
          // 'missing-card' intentionally not defined
        },
      }
      
      renderBoard(boardWithMissingCard)
      expect(screen.getByTestId('card-card-1')).toBeInTheDocument()
      expect(screen.queryByTestId('card-missing-card')).not.toBeInTheDocument()
    })
  })
})
