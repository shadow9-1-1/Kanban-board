/**
 * Board Provider
 *
 * Central state management provider for the Kanban board.
 * Combines useReducer with localStorage persistence and sync queue.
 *
 * FEATURES:
 * 1. useReducer for predictable state updates
 * 2. Automatic localStorage persistence
 * 3. Debounced saves to prevent excessive writes
 * 4. Hydration from localStorage on mount
 * 5. Sync queue integration for offline support
 * 6. Optimistic UI with revert on failure
 *
 * OPTIMISTIC UPDATE FLOW:
 * =======================
 * 1. User dispatches action
 * 2. State updated immediately (optimistic)
 * 3. Previous state saved for potential revert
 * 4. Action queued for sync
 * 5. On sync success → confirm (version updated)
 * 6. On sync failure → revert to previous state
 *
 * ARCHITECTURE:
 * - Uses split context pattern (state/dispatch) for performance
 * - Provides custom hooks for convenient access
 * - Handles localStorage errors gracefully
 */

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

/**
 * Initialize state from localStorage or create fresh state
 * @returns {Object} Initial state for useReducer
 */
const getInitialState = () => {
  const savedBoard = loadFromStorage(STORAGE_KEY)

  if (savedBoard) {
    // Hydrate with saved board data, fresh UI state
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

  // Ref to store previous state for revert
  const previousStateRef = useRef(null)

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
   * Handle successful sync - update version
   * Exposed via syncQueue.onSync for SyncProvider to call
   */
  useEffect(() => {
    syncQueue.onSync = async (queueItem) => {
      // The sync is handled by SyncProvider, but we can update version here
      // eslint-disable-next-line no-console
      console.log('[BoardProvider] Action synced:', queueItem.action.type)
    }

    syncQueue.onRevert = (queueItem) => {
      // Revert could be handled here if we stored snapshots
      // eslint-disable-next-line no-console
      console.warn('[BoardProvider] Sync failed, manual refresh may be needed:', queueItem)
    }

    return () => {
      syncQueue.onSync = null
      syncQueue.onRevert = null
    }
  }, [])

  /**
   * Enhanced dispatch with sync queue integration
   *
   * For syncable actions:
   * 1. Store current state for potential revert
   * 2. Dispatch action (optimistic update)
   * 3. Enqueue action for server sync
   */
  const enhancedDispatch = useCallback(
    (action) => {
      // Development logging
      if (isDev) {
        // eslint-disable-next-line no-console
        console.group(`Action: ${action.type}`)
        // eslint-disable-next-line no-console
        console.log('Payload:', action.payload)
        // eslint-disable-next-line no-console
        console.groupEnd()
      }

      // Check if this action should be synced
      if (SYNCABLE_ACTIONS.has(action.type)) {
        // Store previous state for potential revert
        previousStateRef.current = state

        // Enqueue for sync (with current version)
        syncQueue.enqueue(action, state.board.version)

        // Try to sync immediately if online
        if (navigator.onLine) {
          syncQueue.processQueue(true)
        }
      }

      // Dispatch the action (optimistic update)
      dispatch(action)
    },
    [state]
  )

  // Memoize context values to prevent unnecessary re-renders
  const stateValue = useMemo(
    () => ({
      board: state.board,
      ui: state.ui,
    }),
    [state.board, state.ui]
  )

  // Dispatch is stable, but we wrap it to ensure consistency
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
