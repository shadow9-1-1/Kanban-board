// Board reducer - handles all state transitions
import { ActionTypes } from './boardActions'
import { createInitialData } from '../utils'
import { isDev } from '../utils/env'

// Create fresh initial state
export const createInitialState = () => ({
  board: {
    ...createInitialData(),
    version: 1,
    lastModifiedAt: new Date().toISOString(),
  },
  ui: {
    selectedCard: null,
    confirmDialog: { isOpen: false, title: '', message: '', onConfirm: null },
    conflictDialog: {
      isOpen: false,
      conflicts: [],
      localState: null,
      serverState: null,
      baseState: null,
      resolutions: {},
    },
  },
})

export const boardReducer = (state, action) => {
  switch (action.type) {
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

    case ActionTypes.BOARD_RESET:
      return createInitialState()

    case ActionTypes.BOARD_SET_VERSION: {
      const { version } = action.payload
      return {
        ...state,
        board: { ...state.board, version, lastModifiedAt: new Date().toISOString() },
      }
    }

    case ActionTypes.SYNC_REVERT:
      return action.payload.previousState

    case ActionTypes.COLUMN_ADD: {
      const { id, title } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          columns: { ...state.board.columns, [id]: { id, title, cardIds: [] } },
          columnOrder: [...state.board.columnOrder, id],
        },
      }
    }

    case ActionTypes.COLUMN_RENAME: {
      const { columnId, title } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          columns: {
            ...state.board.columns,
            [columnId]: { ...state.board.columns[columnId], title },
          },
        },
      }
    }

    case ActionTypes.COLUMN_ARCHIVE: {
      const { columnId } = action.payload
      const column = state.board.columns[columnId]
      if (!column) return state

      const newCards = { ...state.board.cards }
      column.cardIds.forEach((cardId) => delete newCards[cardId])

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

    case ActionTypes.CARD_ADD: {
      const { columnId, card } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          cards: { ...state.board.cards, [card.id]: card },
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

    case ActionTypes.CARD_UPDATE: {
      const { cardId, updates } = action.payload
      return {
        ...state,
        board: {
          ...state.board,
          cards: {
            ...state.board.cards,
            [cardId]: { ...state.board.cards[cardId], ...updates, updatedAt: new Date().toISOString() },
          },
        },
      }
    }

    case ActionTypes.CARD_DELETE: {
      const { cardId, columnId } = action.payload
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

    case ActionTypes.CARD_MOVE: {
      const { cardId, sourceColumnId, destColumnId, destIndex } = action.payload
      const sourceColumn = state.board.columns[sourceColumnId]
      const destColumn = state.board.columns[destColumnId]

      const newSourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)

      if (sourceColumnId === destColumnId) {
        const newDestCardIds = [...newSourceCardIds]
        newDestCardIds.splice(destIndex, 0, cardId)
        return {
          ...state,
          board: {
            ...state.board,
            columns: { ...state.board.columns, [sourceColumnId]: { ...sourceColumn, cardIds: newDestCardIds } },
          },
        }
      } else {
        const newDestCardIds = [...destColumn.cardIds]
        newDestCardIds.splice(destIndex, 0, cardId)
        return {
          ...state,
          board: {
            ...state.board,
            columns: {
              ...state.board.columns,
              [sourceColumnId]: { ...sourceColumn, cardIds: newSourceCardIds },
              [destColumnId]: { ...destColumn, cardIds: newDestCardIds },
            },
          },
        }
      }
    }

    case ActionTypes.MODAL_OPEN:
      return { ...state, ui: { ...state.ui, selectedCard: action.payload.card } }

    case ActionTypes.MODAL_CLOSE:
      return { ...state, ui: { ...state.ui, selectedCard: null } }

    case ActionTypes.DIALOG_SHOW: {
      const { title, message, onConfirm } = action.payload
      return { ...state, ui: { ...state.ui, confirmDialog: { isOpen: true, title, message, onConfirm } } }
    }

    case ActionTypes.DIALOG_HIDE:
      return { ...state, ui: { ...state.ui, confirmDialog: { isOpen: false, title: '', message: '', onConfirm: null } } }

    case ActionTypes.CONFLICT_DETECTED: {
      const { conflicts, localState, serverState, baseState } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          conflictDialog: { isOpen: true, conflicts, localState, serverState, baseState, resolutions: {} },
        },
      }
    }

    case ActionTypes.CONFLICT_RESOLVE: {
      const { conflictId, resolution } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          conflictDialog: {
            ...state.ui.conflictDialog,
            resolutions: { ...state.ui.conflictDialog.resolutions, [conflictId]: resolution },
          },
        },
      }
    }

    case ActionTypes.CONFLICT_APPLY_MERGE: {
      const { mergedState } = action.payload
      return {
        ...state,
        board: {
          ...mergedState.board,
          version: mergedState.version || state.board.version + 1,
          lastModifiedAt: mergedState.lastModifiedAt || new Date().toISOString(),
        },
        ui: {
          ...state.ui,
          conflictDialog: { isOpen: false, conflicts: [], localState: null, serverState: null, baseState: null, resolutions: {} },
        },
      }
    }

    case ActionTypes.CONFLICT_DISMISS: {
      const serverState = state.ui.conflictDialog.serverState
      return {
        ...state,
        board: serverState
          ? { ...serverState.board, version: serverState.version, lastModifiedAt: serverState.lastModifiedAt }
          : state.board,
        ui: {
          ...state.ui,
          conflictDialog: { isOpen: false, conflicts: [], localState: null, serverState: null, baseState: null, resolutions: {} },
        },
      }
    }

    default:
      if (isDev) console.warn(`Unknown action type: ${action.type}`)
      return state
  }
}
