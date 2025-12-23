
import { renderHook, act } from '@testing-library/react'
import { useBoard } from './useBoard'

// Mock the utils
jest.mock('../utils', () => ({
  generateId: jest.fn(() => `test-id-${Date.now()}`),
  createInitialData: jest.fn(() => ({
    columns: {
      'col-1': { id: 'col-1', title: 'To Do', cardIds: [] },
    },
    columnOrder: ['col-1'],
    cards: {},
  })),
  saveToStorage: jest.fn(),
  loadFromStorage: jest.fn(() => null),
}))

describe('useBoard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset generateId counter
    let idCounter = 0
    const { generateId } = require('../utils')
    generateId.mockImplementation(() => `test-id-${++idCounter}`)
  })

  describe('Initialization', () => {
    it('should initialize with default board data', () => {
      const { result } = renderHook(() => useBoard())

      expect(result.current.boardData).toBeDefined()
      expect(result.current.boardData.columns).toBeDefined()
      expect(result.current.boardData.columnOrder).toBeDefined()
      expect(result.current.boardData.cards).toBeDefined()
    })

    it('should load from localStorage if available', () => {
      const savedData = {
        columns: { 'saved-col': { id: 'saved-col', title: 'Saved', cardIds: ['saved-card'] } },
        columnOrder: ['saved-col'],
        cards: { 'saved-card': { id: 'saved-card', title: 'Saved Card' } },
      }
      
      const { loadFromStorage } = require('../utils')
      loadFromStorage.mockReturnValueOnce(savedData)

      const { result } = renderHook(() => useBoard())

      expect(result.current.boardData.columnOrder).toEqual(['saved-col'])
    })

    it('should have null selectedCard initially', () => {
      const { result } = renderHook(() => useBoard())
      expect(result.current.selectedCard).toBeNull()
    })

    it('should have closed confirmDialog initially', () => {
      const { result } = renderHook(() => useBoard())
      expect(result.current.confirmDialog.isOpen).toBe(false)
    })
  })

  describe('Column Operations', () => {
    describe('addColumn', () => {
      it('should add a new column', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addColumn('New Column')
        })

        const { columns, columnOrder } = result.current.boardData
        const newColumnId = columnOrder[columnOrder.length - 1]
        
        expect(columns[newColumnId]).toBeDefined()
        expect(columns[newColumnId].title).toBe('New Column')
        expect(columns[newColumnId].cardIds).toEqual([])
      })

      it('should append column to columnOrder', () => {
        const { result } = renderHook(() => useBoard())
        const initialLength = result.current.boardData.columnOrder.length

        act(() => {
          result.current.addColumn('Column A')
        })

        expect(result.current.boardData.columnOrder.length).toBe(initialLength + 1)
      })
    })

    describe('renameColumn', () => {
      it('should rename an existing column', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.renameColumn('col-1', 'Renamed Column')
        })

        expect(result.current.boardData.columns['col-1'].title).toBe('Renamed Column')
      })

      it('should preserve other column properties', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Test Card')
        })

        const cardIdsBefore = result.current.boardData.columns['col-1'].cardIds

        act(() => {
          result.current.renameColumn('col-1', 'New Name')
        })

        expect(result.current.boardData.columns['col-1'].cardIds).toEqual(cardIdsBefore)
      })
    })

    describe('archiveColumn', () => {
      it('should remove column from board', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.archiveColumn('col-1')
        })

        expect(result.current.boardData.columns['col-1']).toBeUndefined()
        expect(result.current.boardData.columnOrder).not.toContain('col-1')
      })

      it('should remove all cards in archived column', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Card 1')
          result.current.addCard('col-1', 'Card 2')
        })

        const cardIds = result.current.boardData.columns['col-1'].cardIds

        act(() => {
          result.current.archiveColumn('col-1')
        })

        cardIds.forEach((id) => {
          expect(result.current.boardData.cards[id]).toBeUndefined()
        })
      })
    })
  })

  describe('Card Operations', () => {
    describe('addCard', () => {
      it('should add a card to column', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'New Card')
        })

        const cardIds = result.current.boardData.columns['col-1'].cardIds
        expect(cardIds.length).toBeGreaterThan(0)

        const cardId = cardIds[cardIds.length - 1]
        expect(result.current.boardData.cards[cardId].title).toBe('New Card')
      })

      it('should create card with default properties', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Test Card')
        })

        const cardIds = result.current.boardData.columns['col-1'].cardIds
        const card = result.current.boardData.cards[cardIds[0]]

        expect(card.description).toBe('')
        expect(card.tags).toEqual([])
        expect(card.createdAt).toBeDefined()
      })
    })

    describe('updateCard', () => {
      it('should update card title', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Original Title')
        })

        const cardId = result.current.boardData.columns['col-1'].cardIds[0]

        act(() => {
          result.current.updateCard(cardId, { title: 'Updated Title' })
        })

        expect(result.current.boardData.cards[cardId].title).toBe('Updated Title')
      })

      it('should update card description', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Test Card')
        })

        const cardId = result.current.boardData.columns['col-1'].cardIds[0]

        act(() => {
          result.current.updateCard(cardId, { description: 'New description' })
        })

        expect(result.current.boardData.cards[cardId].description).toBe('New description')
      })

      it('should update card tags', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Test Card')
        })

        const cardId = result.current.boardData.columns['col-1'].cardIds[0]

        act(() => {
          result.current.updateCard(cardId, { tags: ['urgent', 'bug'] })
        })

        expect(result.current.boardData.cards[cardId].tags).toEqual(['urgent', 'bug'])
      })

      it('should preserve unmodified properties', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Test Card')
        })

        const cardId = result.current.boardData.columns['col-1'].cardIds[0]
        const originalCreatedAt = result.current.boardData.cards[cardId].createdAt

        act(() => {
          result.current.updateCard(cardId, { title: 'New Title' })
        })

        expect(result.current.boardData.cards[cardId].createdAt).toBe(originalCreatedAt)
      })
    })

    describe('deleteCard', () => {
      it('should remove card from board', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.addCard('col-1', 'Card to Delete')
        })

        const cardId = result.current.boardData.columns['col-1'].cardIds[0]

        act(() => {
          result.current.deleteCard(cardId, 'col-1')
        })

        expect(result.current.boardData.cards[cardId]).toBeUndefined()
        expect(result.current.boardData.columns['col-1'].cardIds).not.toContain(cardId)
      })
    })
  })

  describe('moveCard', () => {
    it('should move card within same column', () => {
      const { result } = renderHook(() => useBoard())

      act(() => {
        result.current.addCard('col-1', 'Card 1')
        result.current.addCard('col-1', 'Card 2')
        result.current.addCard('col-1', 'Card 3')
      })

      const [card1, card2, card3] = result.current.boardData.columns['col-1'].cardIds

      act(() => {
        result.current.moveCard(card3, 'col-1', 'col-1', 0)
      })

      expect(result.current.boardData.columns['col-1'].cardIds[0]).toBe(card3)
    })

    it('should move card to different column', () => {
      const { result } = renderHook(() => useBoard())

      act(() => {
        result.current.addColumn('Done')
        result.current.addCard('col-1', 'Card to Move')
      })

      const cardId = result.current.boardData.columns['col-1'].cardIds[0]
      const doneColumnId = result.current.boardData.columnOrder[1]

      act(() => {
        result.current.moveCard(cardId, 'col-1', doneColumnId, 0)
      })

      expect(result.current.boardData.columns['col-1'].cardIds).not.toContain(cardId)
      expect(result.current.boardData.columns[doneColumnId].cardIds).toContain(cardId)
    })

    it('should insert card at specific index', () => {
      const { result } = renderHook(() => useBoard())

      act(() => {
        result.current.addColumn('Done')
        result.current.addCard('col-1', 'Card A')
      })

      const doneColumnId = result.current.boardData.columnOrder[1]

      act(() => {
        result.current.addCard(doneColumnId, 'Card B')
        result.current.addCard(doneColumnId, 'Card C')
      })

      const cardA = result.current.boardData.columns['col-1'].cardIds[0]

      act(() => {
        result.current.moveCard(cardA, 'col-1', doneColumnId, 1)
      })

      expect(result.current.boardData.columns[doneColumnId].cardIds[1]).toBe(cardA)
    })
  })

  describe('Modal Operations', () => {
    describe('openCardModal', () => {
      it('should set selectedCard with columnId', () => {
        const { result } = renderHook(() => useBoard())

        const card = { id: 'test-card', title: 'Test' }

        act(() => {
          result.current.openCardModal(card, 'col-1')
        })

        expect(result.current.selectedCard).toEqual({ ...card, columnId: 'col-1' })
      })
    })

    describe('closeCardModal', () => {
      it('should set selectedCard to null', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.openCardModal({ id: 'test', title: 'Test' }, 'col-1')
        })

        act(() => {
          result.current.closeCardModal()
        })

        expect(result.current.selectedCard).toBeNull()
      })
    })
  })

  describe('Confirm Dialog Operations', () => {
    describe('showConfirmDialog', () => {
      it('should open dialog with title and message', () => {
        const { result } = renderHook(() => useBoard())

        const onConfirm = jest.fn()

        act(() => {
          result.current.showConfirmDialog('Delete Card?', 'Are you sure?', onConfirm)
        })

        expect(result.current.confirmDialog.isOpen).toBe(true)
        expect(result.current.confirmDialog.title).toBe('Delete Card?')
        expect(result.current.confirmDialog.message).toBe('Are you sure?')
        expect(result.current.confirmDialog.onConfirm).toBe(onConfirm)
      })
    })

    describe('closeConfirmDialog', () => {
      it('should close dialog and reset state', () => {
        const { result } = renderHook(() => useBoard())

        act(() => {
          result.current.showConfirmDialog('Title', 'Message', jest.fn())
        })

        act(() => {
          result.current.closeConfirmDialog()
        })

        expect(result.current.confirmDialog.isOpen).toBe(false)
        expect(result.current.confirmDialog.title).toBe('')
        expect(result.current.confirmDialog.message).toBe('')
        expect(result.current.confirmDialog.onConfirm).toBeNull()
      })
    })
  })

  describe('Persistence', () => {
    it('should save to storage on state change', () => {
      const { saveToStorage } = require('../utils')
      const { result } = renderHook(() => useBoard())

      act(() => {
        result.current.addColumn('New Column')
      })

      expect(saveToStorage).toHaveBeenCalled()
    })
  })
})
