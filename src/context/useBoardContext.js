// Custom hooks for accessing Board context
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

// Hook to access board state
export const useBoardState = () => {
  const context = useContext(BoardStateContext)
  if (context === null) {
    throw new Error('useBoardState must be used within a BoardProvider')
  }
  return context
}

// Hook to access dispatch function
export const useBoardDispatch = () => {
  const context = useContext(BoardDispatchContext)
  if (context === null) {
    throw new Error('useBoardDispatch must be used within a BoardProvider')
  }
  return context
}

// Combined hook for both state and dispatch
export const useBoard = () => {
  const state = useBoardState()
  const dispatch = useBoardDispatch()
  return { state, dispatch }
}

// Hook providing pre-bound action dispatchers
export const useBoardActions = () => {
  const dispatch = useBoardDispatch()

  const handleLoadBoard = useCallback(
    (data) => {
      dispatch(loadBoard(data))
    },
    [dispatch]
  )

  const handleResetBoard = useCallback(() => {
    dispatch(resetBoard())
  }, [dispatch])

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

  const handleAddCard = useCallback(
    (columnId, cardData) => {
      const id = generateId()
      dispatch(addCard(id, columnId, cardData.title, cardData.description || '', cardData.tags || []))
      return id
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

  return useMemo(
    () => ({
      dispatch,
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
    }),
    [
      dispatch,
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
