// Board Provider - Central state management with localStorage persistence
import { useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import { isDev } from '../utils/env'
import PropTypes from 'prop-types'
import { BoardStateContext, BoardDispatchContext } from './BoardContext'
import { boardReducer, createInitialState } from './boardReducer'
import { ActionTypes } from './boardActions'
import { loadFromStorage, saveToStorage } from '../utils'
import { syncQueue } from '../services'

const STORAGE_KEY = 'kanban-board-state'
const SAVE_DEBOUNCE_MS = 500

// Actions that should be synced to server
const SYNCABLE_ACTIONS = new Set([
  ActionTypes.COLUMN_ADD,
  ActionTypes.COLUMN_RENAME,
  ActionTypes.COLUMN_ARCHIVE,
  ActionTypes.CARD_ADD,
  ActionTypes.CARD_UPDATE,
  ActionTypes.CARD_DELETE,
  ActionTypes.CARD_MOVE,
])

// Initialize state from localStorage or create fresh state
const getInitialState = () => {
  const savedBoard = loadFromStorage(STORAGE_KEY)

  if (savedBoard) {
    return {
      board: {
        ...savedBoard,
        version: savedBoard.version || 1,
        lastModifiedAt: savedBoard.lastModifiedAt || new Date().toISOString(),
      },
      ui: {
        selectedCard: null,
        confirmDialog: {
          isOpen: false,
          title: '',
          message: '',
          onConfirm: null,
        },
        conflictDialog: {
          isOpen: false,
          conflicts: [],
          localState: null,
          serverState: null,
          baseState: null,
          resolutions: {},
        },
      },
    }
  }

  return createInitialState()
}

// BoardProvider component wraps the app with board state context
export const BoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, null, getInitialState)
  const saveTimerRef = useRef(null)
  const previousStateRef = useRef(null)

  // Persist board state to localStorage with debouncing
  const persistToStorage = useCallback((boardState) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      try {
        saveToStorage(STORAGE_KEY, boardState)
        if (isDev) console.log('Board state persisted to localStorage')
      } catch (error) {
        console.error('Failed to persist board state:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [])

  // Save to localStorage whenever board changes
  useEffect(() => {
    persistToStorage(state.board)
  }, [state.board, persistToStorage])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  // Enhanced dispatch with sync queue integration
  const enhancedDispatch = useCallback(
    (action) => {
      if (isDev) {
        console.group(`Action: ${action.type}`)
        console.log('Payload:', action.payload)
        console.log('Current version:', state.board.version)
        console.groupEnd()
      }

      if (SYNCABLE_ACTIONS.has(action.type)) {
        previousStateRef.current = state
        syncQueue.enqueue(action, state.board.version)

        if (navigator.onLine) {
          syncQueue.processQueue(true)
        }
      }

      dispatch(action)
    },
    [state]
  )

  const stateValue = useMemo(
    () => ({
      board: state.board,
      ui: state.ui,
    }),
    [state.board, state.ui]
  )

  const dispatchValue = useMemo(() => enhancedDispatch, [enhancedDispatch])

  return (
    <BoardStateContext.Provider value={stateValue}>
      <BoardDispatchContext.Provider value={dispatchValue}>
        {children}
      </BoardDispatchContext.Provider>
    </BoardStateContext.Provider>
  )
}

BoardProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
