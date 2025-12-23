/**
 * Custom hooks for accessing Board context
 *
 * These hooks provide type-safe, convenient access to board state and dispatch.
 * They throw helpful errors if used outside of BoardProvider.
 */

import { useContext, useCallback, useMemo } from 'react'
import { BoardStateContext, BoardDispatchContext } from './BoardContext'
import {
  loadBoard,
  resetBoard,
  addColumn,
  renameColumn,
  archiveColumn,
  addCard,
  updateCard,
  deleteCard,
  moveCard,
  openModal,
  closeModal,
  showDialog,
  hideDialog,
} from './boardActions'
import { generateId } from '../utils'

/**
 * Hook to access board state
 *
 * @returns {{ board: Object, ui: Object }} Current board state
 * @throws {Error} If used outside BoardProvider
 *
 * @example
 * const { board, ui } = useBoardState()
 * console.log(board.columns, board.cards)
 */
export const useBoardState = () => {
  const context = useContext(BoardStateContext)

  if (context === null) {
    throw new Error('useBoardState must be used within a BoardProvider')
  }

  return context
}

/**
 * Hook to access dispatch function
 *
 * @returns {Function} Dispatch function
 * @throws {Error} If used outside BoardProvider
 *
 * @example
 * const dispatch = useBoardDispatch()
 * dispatch(addCard(columnId, card))
 */
export const useBoardDispatch = () => {
  const context = useContext(BoardDispatchContext)

  if (context === null) {
    throw new Error('useBoardDispatch must be used within a BoardProvider')
  }

  return context
}

/**
 * Combined hook for both state and dispatch
 *
 * @returns {{ state: Object, dispatch: Function }}
 *
 * @example
 * const { state, dispatch } = useBoard()
 */
export const useBoard = () => {
  const state = useBoardState()
  const dispatch = useBoardDispatch()

  return { state, dispatch }
}

/**
 * Hook providing pre-bound action dispatchers
 *
 * Returns memoized action functions that automatically dispatch.
 * This is the recommended way to dispatch actions from components.
 *
 * @returns {Object} Object containing all bound action functions
 *
 * @example
 * const { handleAddColumn, handleAddCard, handleMoveCard } = useBoardActions()
 *
 * // Add a new column
 * handleAddColumn('New Column')
 *
 * // Add a card to a column
 * handleAddCard('column-1', { title: 'New Task', description: '', tags: [] })
 */
export const useBoardActions = () => {
  const dispatch = useBoardDispatch()

  // ==================== BOARD ACTIONS ====================

  const handleLoadBoard = useCallback(
    (data) => {
      dispatch(loadBoard(data))
    },
    [dispatch]
  )

  const handleResetBoard = useCallback(() => {
    dispatch(resetBoard())
  }, [dispatch])

  // ==================== COLUMN ACTIONS ====================

  const handleAddColumn = useCallback(
    (title) => {
      const id = generateId()
      dispatch(addColumn(id, title))
      return id
    },
    [dispatch]
  )

  const handleRenameColumn = useCallback(
    (columnId, title) => {
      dispatch(renameColumn(columnId, title))
    },
    [dispatch]
  )

  const handleArchiveColumn = useCallback(
    (columnId) => {
      dispatch(archiveColumn(columnId))
    },
    [dispatch]
  )

  // ==================== CARD ACTIONS ====================

  const handleAddCard = useCallback(
    (columnId, cardData) => {
      const card = {
        id: generateId(),
        title: cardData.title,
        description: cardData.description || '',
        tags: cardData.tags || [],
        createdAt: new Date().toISOString(),
      }
      dispatch(addCard(columnId, card))
      return card.id
    },
    [dispatch]
  )

  const handleUpdateCard = useCallback(
    (cardId, updates) => {
      dispatch(updateCard(cardId, updates))
    },
    [dispatch]
  )

  const handleDeleteCard = useCallback(
    (cardId, columnId) => {
      dispatch(deleteCard(cardId, columnId))
    },
    [dispatch]
  )

  const handleMoveCard = useCallback(
    (cardId, sourceColumnId, destColumnId, destIndex) => {
      dispatch(moveCard(cardId, sourceColumnId, destColumnId, destIndex))
    },
    [dispatch]
  )

  // ==================== UI ACTIONS ====================

  const handleOpenModal = useCallback(
    (card) => {
      dispatch(openModal(card))
    },
    [dispatch]
  )

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal())
  }, [dispatch])

  const handleShowDialog = useCallback(
    (title, message, onConfirm) => {
      dispatch(showDialog(title, message, onConfirm))
    },
    [dispatch]
  )

  const handleHideDialog = useCallback(() => {
    dispatch(hideDialog())
  }, [dispatch])

  // Memoize the entire actions object
  return useMemo(
    () => ({
      // Board
      handleLoadBoard,
      handleResetBoard,
      // Columns
      handleAddColumn,
      handleRenameColumn,
      handleArchiveColumn,
      // Cards
      handleAddCard,
      handleUpdateCard,
      handleDeleteCard,
      handleMoveCard,
      // UI
      handleOpenModal,
      handleCloseModal,
      handleShowDialog,
      handleHideDialog,
    }),
    [
      handleLoadBoard,
      handleResetBoard,
      handleAddColumn,
      handleRenameColumn,
      handleArchiveColumn,
      handleAddCard,
      handleUpdateCard,
      handleDeleteCard,
      handleMoveCard,
      handleOpenModal,
      handleCloseModal,
      handleShowDialog,
      handleHideDialog,
    ]
  )
}
