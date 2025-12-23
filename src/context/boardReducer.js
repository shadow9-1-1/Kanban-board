/**
 * Board Reducer
 *
 * Pure function that handles all state transitions for the Kanban board.
 * Follows Redux-style immutable update patterns.
 *
 * IMMUTABILITY RULES:
 * 1. Never mutate state directly - always return new objects
 * 2. Use spread operator (...) to copy objects/arrays
 * 3. Use .filter(), .map() for array transformations (not .splice(), .push())
 * 4. For nested updates, spread at each level
 *
 * STATE SHAPE:
 * {
 *   board: {
 *     columns: { [id]: { id, title, cardIds: [] } },
 *     columnOrder: [id1, id2, id3],
 *     cards: { [id]: { id, title, description, tags, createdAt } },
 *     version: number,           // For sync conflict detection
 *     lastModifiedAt: string     // ISO timestamp
 *   },
 *   ui: {
 *     selectedCard: null | { ...card, columnId },
 *     confirmDialog: { isOpen, title, message, onConfirm }
 *   }
 * }
 */

import { ActionTypes } from './boardActions'
import { createInitialData } from '../utils'
import { isDev } from '../utils/env'

/**
 * Initial state factory
 * @returns {Object} Fresh initial state
 */
export const createInitialState = () => ({
  board: {
    ...createInitialData(),
    version: 1,
    lastModifiedAt: new Date().toISOString(),
  },
  ui: {
    selectedCard: null,
    confirmDialog: {
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
    },
  },
})

/**
 * Board Reducer
 *
 * @param {Object} state - Current state
 * @param {Object} action - Action object { type, payload }
 * @returns {Object} New state (never mutates input)
 */
export const boardReducer = (state, action) => {
  switch (action.type) {
    // ==================== BOARD ACTIONS ====================

    /**
     * BOARD_LOAD: Replace board data with loaded data
     * Used when loading from localStorage/IndexedDB
     */
    case ActionTypes.BOARD_LOAD: {
      const { data } = action.payload
      return {
        ...state,
        board: {
          ...data,
          version: data.version || 1,
          lastModifiedAt: data.lastModifiedAt || new Date().toISOString(),
        },
      }
    }

    /**
     * BOARD_RESET: Reset to initial state
     * Used for "clear all data" functionality
     */
    case ActionTypes.BOARD_RESET: {
      return createInitialState()
    }

    /**
     * BOARD_SET_VERSION: Update version from server sync
     */
    case ActionTypes.BOARD_SET_VERSION: {
      const { version } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          version,
          lastModifiedAt: new Date().toISOString(),
        },
      }
    }

    /**
     * SYNC_REVERT: Revert to previous state on sync failure
     */
    case ActionTypes.SYNC_REVERT: {
      const { previousState } = action.payload
      return previousState
    }

    // ==================== COLUMN ACTIONS ====================

    /**
     * COLUMN_ADD: Add a new column to the board
     *
     * Immutability breakdown:
     * 1. Spread state to copy top level
     * 2. Spread board to copy board level
     * 3. Spread columns to copy columns object
     * 4. Add new column entry
     * 5. Spread columnOrder and append new id
     */
    case ActionTypes.COLUMN_ADD: {
      const { id, title } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          columns: {
            ...state.board.columns,
            [id]: {
              id,
              title,
              cardIds: [],
            },
          },
          columnOrder: [...state.board.columnOrder, id],
        },
      }
    }

    /**
     * COLUMN_RENAME: Update column title
     *
     * Only the specific column object is replaced,
     * other columns remain unchanged (referential equality)
     */
    case ActionTypes.COLUMN_RENAME: {
      const { columnId, title } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          columns: {
            ...state.board.columns,
            [columnId]: {
              ...state.board.columns[columnId],
              title,
            },
          },
        },
      }
    }

    /**
     * COLUMN_ARCHIVE: Remove column and all its cards
     *
     * This is a complex operation:
     * 1. Get list of card IDs in the column
     * 2. Create new cards object WITHOUT those cards
     * 3. Create new columns object WITHOUT this column
     * 4. Filter columnOrder to remove this column's ID
     */
    case ActionTypes.COLUMN_ARCHIVE: {
      const { columnId } = action.payload
      const column = state.board.columns[columnId]

      if (!column) {
        return state // Column doesn't exist, no change
      }

      // Create new cards object without the archived column's cards
      const newCards = { ...state.board.cards }
      column.cardIds.forEach((cardId) => {
        delete newCards[cardId]
      })

      // Create new columns object without the archived column
      const newColumns = { ...state.board.columns }
      delete newColumns[columnId]

      return {
        ...state,
        board: {
          ...state.board,
          columns: newColumns,
          columnOrder: state.board.columnOrder.filter((id) => id !== columnId),
          cards: newCards,
        },
      }
    }

    // ==================== CARD ACTIONS ====================

    /**
     * CARD_ADD: Add new card to a column
     *
     * Two updates needed:
     * 1. Add card to cards object
     * 2. Append card ID to column's cardIds array
     */
    case ActionTypes.CARD_ADD: {
      const { columnId, card } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          cards: {
            ...state.board.cards,
            [card.id]: card,
          },
          columns: {
            ...state.board.columns,
            [columnId]: {
              ...state.board.columns[columnId],
              cardIds: [...state.board.columns[columnId].cardIds, card.id],
            },
          },
        },
      }
    }

    /**
     * CARD_UPDATE: Update card properties
     *
     * Merges updates into existing card object
     * Only specified fields are changed
     */
    case ActionTypes.CARD_UPDATE: {
      const { cardId, updates } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          cards: {
            ...state.board.cards,
            [cardId]: {
              ...state.board.cards[cardId],
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      }
    }

    /**
     * CARD_DELETE: Remove card from board
     *
     * Two updates needed:
     * 1. Remove card from cards object
     * 2. Filter card ID from column's cardIds array
     */
    case ActionTypes.CARD_DELETE: {
      const { cardId, columnId } = action.payload

      // Create new cards object without the deleted card
      const newCards = { ...state.board.cards }
      delete newCards[cardId]

      return {
        ...state,
        board: {
          ...state.board,
          cards: newCards,
          columns: {
            ...state.board.columns,
            [columnId]: {
              ...state.board.columns[columnId],
              cardIds: state.board.columns[columnId].cardIds.filter((id) => id !== cardId),
            },
          },
        },
      }
    }

    /**
     * CARD_MOVE: Move card within or between columns
     *
     * Most complex operation - handles:
     * 1. Same column reorder
     * 2. Cross-column move
     *
     * Algorithm:
     * 1. Remove card from source column's cardIds
     * 2. Insert card at destIndex in destination column's cardIds
     */
    case ActionTypes.CARD_MOVE: {
      const { cardId, sourceColumnId, destColumnId, destIndex } = action.payload

      const sourceColumn = state.board.columns[sourceColumnId]
      const destColumn = state.board.columns[destColumnId]

      // Remove card from source
      const newSourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)

      // Calculate destination card IDs
      let newDestCardIds
      if (sourceColumnId === destColumnId) {
        // Same column - reorder within newSourceCardIds
        newDestCardIds = [...newSourceCardIds]
        newDestCardIds.splice(destIndex, 0, cardId)

        return {
          ...state,
          board: {
            ...state.board,
            columns: {
              ...state.board.columns,
              [sourceColumnId]: {
                ...sourceColumn,
                cardIds: newDestCardIds,
              },
            },
          },
        }
      } else {
        // Different column - add to destination
        newDestCardIds = [...destColumn.cardIds]
        newDestCardIds.splice(destIndex, 0, cardId)

        return {
          ...state,
          board: {
            ...state.board,
            columns: {
              ...state.board.columns,
              [sourceColumnId]: {
                ...sourceColumn,
                cardIds: newSourceCardIds,
              },
              [destColumnId]: {
                ...destColumn,
                cardIds: newDestCardIds,
              },
            },
          },
        }
      }
    }

    // ==================== UI ACTIONS ====================

    /**
     * MODAL_OPEN: Set selected card for editing
     */
    case ActionTypes.MODAL_OPEN: {
      const { card } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedCard: card,
        },
      }
    }

    /**
     * MODAL_CLOSE: Clear selected card
     */
    case ActionTypes.MODAL_CLOSE: {
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedCard: null,
        },
      }
    }

    /**
     * DIALOG_SHOW: Display confirmation dialog
     */
    case ActionTypes.DIALOG_SHOW: {
      const { title, message, onConfirm } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          confirmDialog: {
            isOpen: true,
            title,
            message,
            onConfirm,
          },
        },
      }
    }

    /**
     * DIALOG_HIDE: Hide confirmation dialog
     */
    case ActionTypes.DIALOG_HIDE: {
      return {
        ...state,
        ui: {
          ...state.ui,
          confirmDialog: {
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
          },
        },
      }
    }

    // ==================== DEFAULT ====================

    default: {
      // In development, warn about unknown actions
      if (isDev) {
        // eslint-disable-next-line no-console
        console.warn(`Unknown action type: ${action.type}`)
      }
      return state
    }
  }
}
