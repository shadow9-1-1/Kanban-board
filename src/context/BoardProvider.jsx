/**
 * Board Provider
 *
 * Central state management provider for the Kanban board.
 * Combines useReducer with localStorage persistence.
 *
 * FEATURES:
 * 1. useReducer for predictable state updates
 * 2. Automatic localStorage persistence
 * 3. Debounced saves to prevent excessive writes
 * 4. Hydration from localStorage on mount
 *
 * ARCHITECTURE:
 * - Uses split context pattern (state/dispatch) for performance
 * - Provides custom hooks for convenient access
 * - Handles localStorage errors gracefully
 */

import { useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { BoardStateContext, BoardDispatchContext } from './BoardContext'
import { boardReducer, createInitialState } from './boardReducer'
import { loadFromStorage, saveToStorage } from '../utils'

const STORAGE_KEY = 'kanban-board-state'
const SAVE_DEBOUNCE_MS = 500

/**
 * Initialize state from localStorage or create fresh state
 * @returns {Object} Initial state for useReducer
 */
const getInitialState = () => {
  const savedBoard = loadFromStorage(STORAGE_KEY)

  if (savedBoard) {
    // Hydrate with saved board data, fresh UI state
    return {
      board: savedBoard,
      ui: {
        selectedCard: null,
        confirmDialog: {
          isOpen: false,
          title: '',
          message: '',
          onConfirm: null,
        },
      },
    }
  }

  return createInitialState()
}

/**
 * BoardProvider Component
 *
 * Wraps the application with board state context.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 *
 * @example
 * <BoardProvider>
 *   <App />
 * </BoardProvider>
 */
export const BoardProvider = ({ children }) => {
  // Initialize reducer with persisted or fresh state
  const [state, dispatch] = useReducer(boardReducer, null, getInitialState)

  // Ref for debounce timer
  const saveTimerRef = useRef(null)

  /**
   * Persist board state to localStorage
   * Uses debouncing to prevent excessive writes during rapid updates
   */
  useEffect(() => {
    // Clear any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Debounce the save operation
    saveTimerRef.current = setTimeout(() => {
      try {
        // Only persist board data, not UI state
        saveToStorage(STORAGE_KEY, state.board)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save board state:', error)
      }
    }, SAVE_DEBOUNCE_MS)

    // Cleanup timer on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [state.board])

  /**
   * Wrapped dispatch with optional middleware
   * Currently passes through, but can be extended for logging, analytics, etc.
   */
  const enhancedDispatch = useCallback((action) => {
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group(`Action: ${action.type}`)
      // eslint-disable-next-line no-console
      console.log('Payload:', action.payload)
      // eslint-disable-next-line no-console
      console.groupEnd()
    }

    dispatch(action)
  }, [])

  // Memoize context values to prevent unnecessary re-renders
  const stateValue = useMemo(
    () => ({
      board: state.board,
      ui: state.ui,
    }),
    [state.board, state.ui]
  )

  // Dispatch is stable, but we wrap it to ensure consistency
  const dispatchValue = useMemo(
    () => enhancedDispatch,
    [enhancedDispatch]
  )

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
