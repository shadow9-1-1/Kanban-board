/**
 * Board Reducer Unit Tests
 *
 * Tests all reducer action types for correct state transitions.
 * Verifies immutability by checking that original state is not mutated.
 *
 * TEST ORGANIZATION:
 * - Grouped by action type category (Board, Column, Card, UI)
 * - Each test verifies: correct output + immutability
 */

import { boardReducer, createInitialState } from './boardReducer'
import { ActionTypes } from './boardActions'

describe('boardReducer', () => {
  let initialState

  beforeEach(() => {
    initialState = createInitialState()
  })

  // ==================== BOARD ACTIONS ====================

  describe('BOARD_LOAD', () => {
    it('should replace board data with loaded data', () => {
      const loadedData = {
        columns: { col1: { id: 'col1', title: 'Test', cardIds: [] } },
        columnOrder: ['col1'],
        cards: {},
        version: 5,
        lastModifiedAt: '2024-01-01T00:00:00.000Z',
      }

      const action = {
        type: ActionTypes.BOARD_LOAD,
        payload: { data: loadedData },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.board.columns).toEqual(loadedData.columns)
      expect(newState.board.columnOrder).toEqual(loadedData.columnOrder)
      expect(newState.board.version).toBe(5)
      // Original state should not be mutated
      expect(initialState.board.columns).not.toEqual(loadedData.columns)
    })

    it('should default version to 1 if not provided', () => {
      const loadedData = {
        columns: {},
        columnOrder: [],
        cards: {},
      }

      const action = {
        type: ActionTypes.BOARD_LOAD,
        payload: { data: loadedData },
      }

      const newState = boardReducer(initialState, action)
      expect(newState.board.version).toBe(1)
    })
  })

  describe('BOARD_RESET', () => {
    it('should reset to initial state', () => {
      // Modify state first
      const modifiedState = {
        ...initialState,
        board: {
          ...initialState.board,
          columns: { custom: { id: 'custom', title: 'Custom', cardIds: [] } },
        },
      }

      const action = { type: ActionTypes.BOARD_RESET }
      const newState = boardReducer(modifiedState, action)

      // Should be fresh initial state
      expect(newState.board.columnOrder).toHaveLength(3) // Default columns
      expect(newState.ui.selectedCard).toBeNull()
    })
  })

  describe('BOARD_SET_VERSION', () => {
    it('should update version number', () => {
      const action = {
        type: ActionTypes.BOARD_SET_VERSION,
        payload: { version: 10 },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.board.version).toBe(10)
      expect(newState.board.lastModifiedAt).toBeDefined()
    })
  })

  describe('SYNC_REVERT', () => {
    it('should revert to previous state', () => {
      const previousState = {
        ...initialState,
        board: { ...initialState.board, version: 99 },
      }

      const action = {
        type: ActionTypes.SYNC_REVERT,
        payload: { previousState },
      }

      const newState = boardReducer(initialState, action)
      expect(newState.board.version).toBe(99)
    })
  })

  // ==================== COLUMN ACTIONS ====================

  describe('COLUMN_ADD', () => {
    it('should add a new column to the board', () => {
      const action = {
        type: ActionTypes.COLUMN_ADD,
        payload: { id: 'new-col', title: 'New Column' },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.board.columns['new-col']).toEqual({
        id: 'new-col',
        title: 'New Column',
        cardIds: [],
      })
      expect(newState.board.columnOrder).toContain('new-col')
    })

    it('should append column to end of columnOrder', () => {
      const action = {
        type: ActionTypes.COLUMN_ADD,
        payload: { id: 'new-col', title: 'New Column' },
      }

      const newState = boardReducer(initialState, action)
      const lastId = newState.board.columnOrder[newState.board.columnOrder.length - 1]

      expect(lastId).toBe('new-col')
    })

    it('should not mutate original state', () => {
      const originalColumnOrder = [...initialState.board.columnOrder]

      const action = {
        type: ActionTypes.COLUMN_ADD,
        payload: { id: 'new-col', title: 'New Column' },
      }

      boardReducer(initialState, action)

      expect(initialState.board.columnOrder).toEqual(originalColumnOrder)
      expect(initialState.board.columns['new-col']).toBeUndefined()
    })
  })

  describe('COLUMN_RENAME', () => {
    it('should update column title', () => {
      // Get first column ID
      const columnId = initialState.board.columnOrder[0]
      const originalTitle = initialState.board.columns[columnId].title

      const action = {
        type: ActionTypes.COLUMN_RENAME,
        payload: { columnId, title: 'Renamed Column' },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.board.columns[columnId].title).toBe('Renamed Column')
      // Original should be unchanged
      expect(initialState.board.columns[columnId].title).toBe(originalTitle)
    })
  })

  describe('COLUMN_ARCHIVE', () => {
    it('should remove column from board', () => {
      const columnId = initialState.board.columnOrder[0]

      const action = {
        type: ActionTypes.COLUMN_ARCHIVE,
        payload: { columnId },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.board.columns[columnId]).toBeUndefined()
      expect(newState.board.columnOrder).not.toContain(columnId)
    })

    it('should remove all cards in archived column', () => {
      // First add a card to the column
      const columnId = initialState.board.columnOrder[0]
      const cardId = 'test-card'

      const stateWithCard = {
        ...initialState,
        board: {
          ...initialState.board,
          cards: {
            ...initialState.board.cards,
            [cardId]: { id: cardId, title: 'Test Card' },
          },
          columns: {
            ...initialState.board.columns,
            [columnId]: {
              ...initialState.board.columns[columnId],
              cardIds: [cardId],
            },
          },
        },
      }

      const action = {
        type: ActionTypes.COLUMN_ARCHIVE,
        payload: { columnId },
      }

      const newState = boardReducer(stateWithCard, action)

      expect(newState.board.cards[cardId]).toBeUndefined()
    })

    it('should return unchanged state if column does not exist', () => {
      const action = {
        type: ActionTypes.COLUMN_ARCHIVE,
        payload: { columnId: 'non-existent' },
      }

      const newState = boardReducer(initialState, action)
      expect(newState).toBe(initialState)
    })
  })

  // ==================== CARD ACTIONS ====================

  describe('CARD_ADD', () => {
    it('should add a new card to the specified column', () => {
      const columnId = initialState.board.columnOrder[0]
      const card = {
        id: 'new-card',
        title: 'New Card',
        description: 'Description',
        tags: [],
        createdAt: new Date().toISOString(),
      }

      const action = {
        type: ActionTypes.CARD_ADD,
        payload: { columnId, card },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.board.cards['new-card']).toEqual(card)
      expect(newState.board.columns[columnId].cardIds).toContain('new-card')
    })

    it('should append card to end of column', () => {
      const columnId = initialState.board.columnOrder[0]
      const card = { id: 'new-card', title: 'New Card' }

      const action = {
        type: ActionTypes.CARD_ADD,
        payload: { columnId, card },
      }

      const newState = boardReducer(initialState, action)
      const cardIds = newState.board.columns[columnId].cardIds
      const lastId = cardIds[cardIds.length - 1]

      expect(lastId).toBe('new-card')
    })
  })

  describe('CARD_UPDATE', () => {
    it('should update card properties', () => {
      // Setup: Add a card first
      const columnId = initialState.board.columnOrder[0]
      const cardId = 'test-card'

      const stateWithCard = {
        ...initialState,
        board: {
          ...initialState.board,
          cards: {
            ...initialState.board.cards,
            [cardId]: {
              id: cardId,
              title: 'Original Title',
              description: 'Original',
              tags: [],
            },
          },
          columns: {
            ...initialState.board.columns,
            [columnId]: {
              ...initialState.board.columns[columnId],
              cardIds: [cardId],
            },
          },
        },
      }

      const action = {
        type: ActionTypes.CARD_UPDATE,
        payload: {
          cardId,
          updates: { title: 'Updated Title', description: 'Updated' },
        },
      }

      const newState = boardReducer(stateWithCard, action)

      expect(newState.board.cards[cardId].title).toBe('Updated Title')
      expect(newState.board.cards[cardId].description).toBe('Updated')
      expect(newState.board.cards[cardId].updatedAt).toBeDefined()
    })

    it('should preserve unmodified properties', () => {
      const cardId = 'test-card'
      const stateWithCard = {
        ...initialState,
        board: {
          ...initialState.board,
          cards: {
            [cardId]: {
              id: cardId,
              title: 'Title',
              description: 'Desc',
              tags: ['tag1'],
            },
          },
        },
      }

      const action = {
        type: ActionTypes.CARD_UPDATE,
        payload: { cardId, updates: { title: 'New Title' } },
      }

      const newState = boardReducer(stateWithCard, action)

      expect(newState.board.cards[cardId].tags).toEqual(['tag1'])
      expect(newState.board.cards[cardId].description).toBe('Desc')
    })
  })

  describe('CARD_DELETE', () => {
    it('should remove card from board', () => {
      const columnId = initialState.board.columnOrder[0]
      const cardId = 'test-card'

      const stateWithCard = {
        ...initialState,
        board: {
          ...initialState.board,
          cards: { [cardId]: { id: cardId, title: 'Test' } },
          columns: {
            ...initialState.board.columns,
            [columnId]: {
              ...initialState.board.columns[columnId],
              cardIds: [cardId],
            },
          },
        },
      }

      const action = {
        type: ActionTypes.CARD_DELETE,
        payload: { cardId, columnId },
      }

      const newState = boardReducer(stateWithCard, action)

      expect(newState.board.cards[cardId]).toBeUndefined()
      expect(newState.board.columns[columnId].cardIds).not.toContain(cardId)
    })
  })

  describe('CARD_MOVE', () => {
    let stateWithCards

    beforeEach(() => {
      // Setup state with cards in first column
      const col1 = initialState.board.columnOrder[0]
      const col2 = initialState.board.columnOrder[1]

      stateWithCards = {
        ...initialState,
        board: {
          ...initialState.board,
          cards: {
            card1: { id: 'card1', title: 'Card 1' },
            card2: { id: 'card2', title: 'Card 2' },
            card3: { id: 'card3', title: 'Card 3' },
          },
          columns: {
            ...initialState.board.columns,
            [col1]: {
              ...initialState.board.columns[col1],
              cardIds: ['card1', 'card2', 'card3'],
            },
            [col2]: {
              ...initialState.board.columns[col2],
              cardIds: [],
            },
          },
        },
      }
    })

    it('should move card within same column (reorder)', () => {
      const columnId = initialState.board.columnOrder[0]

      const action = {
        type: ActionTypes.CARD_MOVE,
        payload: {
          cardId: 'card1',
          sourceColumnId: columnId,
          destColumnId: columnId,
          destIndex: 2,
        },
      }

      const newState = boardReducer(stateWithCards, action)
      const cardIds = newState.board.columns[columnId].cardIds

      expect(cardIds).toEqual(['card2', 'card3', 'card1'])
    })

    it('should move card to different column', () => {
      const col1 = initialState.board.columnOrder[0]
      const col2 = initialState.board.columnOrder[1]

      const action = {
        type: ActionTypes.CARD_MOVE,
        payload: {
          cardId: 'card1',
          sourceColumnId: col1,
          destColumnId: col2,
          destIndex: 0,
        },
      }

      const newState = boardReducer(stateWithCards, action)

      expect(newState.board.columns[col1].cardIds).not.toContain('card1')
      expect(newState.board.columns[col2].cardIds).toContain('card1')
      expect(newState.board.columns[col2].cardIds[0]).toBe('card1')
    })

    it('should preserve card data when moving', () => {
      const col1 = initialState.board.columnOrder[0]
      const col2 = initialState.board.columnOrder[1]

      const action = {
        type: ActionTypes.CARD_MOVE,
        payload: {
          cardId: 'card1',
          sourceColumnId: col1,
          destColumnId: col2,
          destIndex: 0,
        },
      }

      const newState = boardReducer(stateWithCards, action)

      expect(newState.board.cards['card1']).toEqual(stateWithCards.board.cards['card1'])
    })
  })

  // ==================== UI ACTIONS ====================

  describe('MODAL_OPEN', () => {
    it('should set selected card with column ID', () => {
      const card = { id: 'card1', title: 'Test Card' }
      const columnId = 'col1'

      // The action creator adds columnId to the card object
      const action = {
        type: ActionTypes.MODAL_OPEN,
        payload: { card: { ...card, columnId } },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.ui.selectedCard).toEqual({ ...card, columnId })
    })
  })

  describe('MODAL_CLOSE', () => {
    it('should clear selected card', () => {
      const stateWithModal = {
        ...initialState,
        ui: {
          ...initialState.ui,
          selectedCard: { id: 'card1', title: 'Test', columnId: 'col1' },
        },
      }

      const action = { type: ActionTypes.MODAL_CLOSE }
      const newState = boardReducer(stateWithModal, action)

      expect(newState.ui.selectedCard).toBeNull()
    })
  })

  describe('DIALOG_SHOW', () => {
    it('should open confirmation dialog with props', () => {
      const onConfirm = jest.fn()

      const action = {
        type: ActionTypes.DIALOG_SHOW,
        payload: {
          title: 'Confirm Delete',
          message: 'Are you sure?',
          onConfirm,
        },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.ui.confirmDialog.isOpen).toBe(true)
      expect(newState.ui.confirmDialog.title).toBe('Confirm Delete')
      expect(newState.ui.confirmDialog.message).toBe('Are you sure?')
      expect(newState.ui.confirmDialog.onConfirm).toBe(onConfirm)
    })
  })

  describe('DIALOG_HIDE', () => {
    it('should close confirmation dialog', () => {
      const stateWithDialog = {
        ...initialState,
        ui: {
          ...initialState.ui,
          confirmDialog: {
            isOpen: true,
            title: 'Test',
            message: 'Test',
            onConfirm: jest.fn(),
          },
        },
      }

      const action = { type: ActionTypes.DIALOG_HIDE }
      const newState = boardReducer(stateWithDialog, action)

      expect(newState.ui.confirmDialog.isOpen).toBe(false)
      expect(newState.ui.confirmDialog.onConfirm).toBeNull()
    })
  })

  // ==================== CONFLICT ACTIONS ====================

  describe('CONFLICT_DETECTED', () => {
    it('should open conflict dialog with data', () => {
      const conflicts = [{ id: 'c1', type: 'SAME_FIELD' }]
      const localState = { version: 1 }
      const serverState = { version: 2 }
      const baseState = { version: 0 }

      const action = {
        type: ActionTypes.CONFLICT_DETECTED,
        payload: { conflicts, localState, serverState, baseState },
      }

      const newState = boardReducer(initialState, action)

      expect(newState.ui.conflictDialog.isOpen).toBe(true)
      expect(newState.ui.conflictDialog.conflicts).toEqual(conflicts)
      expect(newState.ui.conflictDialog.localState).toEqual(localState)
      expect(newState.ui.conflictDialog.serverState).toEqual(serverState)
    })
  })

  describe('CONFLICT_RESOLVE', () => {
    it('should record resolution for a conflict', () => {
      const stateWithConflict = {
        ...initialState,
        ui: {
          ...initialState.ui,
          conflictDialog: {
            isOpen: true,
            conflicts: [{ id: 'c1' }],
            resolutions: {},
          },
        },
      }

      const action = {
        type: ActionTypes.CONFLICT_RESOLVE,
        payload: { conflictId: 'c1', resolution: { choice: 'KEEP_LOCAL' } },
      }

      const newState = boardReducer(stateWithConflict, action)

      expect(newState.ui.conflictDialog.resolutions['c1']).toEqual({ choice: 'KEEP_LOCAL' })
    })
  })

  describe('CONFLICT_DISMISS', () => {
    it('should close conflict dialog and reset state', () => {
      const stateWithConflict = {
        ...initialState,
        ui: {
          ...initialState.ui,
          conflictDialog: {
            isOpen: true,
            conflicts: [{ id: 'c1' }],
            resolutions: { c1: { choice: 'KEEP_LOCAL' } },
          },
        },
      }

      const action = { type: ActionTypes.CONFLICT_DISMISS }
      const newState = boardReducer(stateWithConflict, action)

      expect(newState.ui.conflictDialog.isOpen).toBe(false)
      expect(newState.ui.conflictDialog.conflicts).toEqual([])
      expect(newState.ui.conflictDialog.resolutions).toEqual({})
    })
  })

  // ==================== UNKNOWN ACTION ====================

  describe('Unknown action', () => {
    it('should return state unchanged for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION' }
      const newState = boardReducer(initialState, action)

      expect(newState).toBe(initialState)
    })
  })

  // ==================== IMMUTABILITY TESTS ====================

  describe('Immutability', () => {
    it('should create new state object on every action', () => {
      const action = {
        type: ActionTypes.COLUMN_ADD,
        payload: { id: 'new-col', title: 'New' },
      }

      const newState = boardReducer(initialState, action)

      expect(newState).not.toBe(initialState)
      expect(newState.board).not.toBe(initialState.board)
      expect(newState.board.columns).not.toBe(initialState.board.columns)
      expect(newState.board.columnOrder).not.toBe(initialState.board.columnOrder)
    })

    it('should not modify nested arrays', () => {
      const columnId = initialState.board.columnOrder[0]
      const originalCardIds = [...initialState.board.columns[columnId].cardIds]

      const card = { id: 'new-card', title: 'New Card' }
      const action = {
        type: ActionTypes.CARD_ADD,
        payload: { columnId, card },
      }

      boardReducer(initialState, action)

      expect(initialState.board.columns[columnId].cardIds).toEqual(originalCardIds)
    })
  })
})
