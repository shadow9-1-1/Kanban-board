// useBoard Hook - Manages all Kanban board state and operations
import { useState, useEffect, useCallback } from 'react'
import { generateId, createInitialData, saveToStorage, loadFromStorage } from '../utils'

export const useBoard = () => {
  const [boardData, setBoardData] = useState(() => {
    const saved = loadFromStorage()
    return saved || createInitialData()
  })

  const [selectedCard, setSelectedCard] = useState(null)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  useEffect(() => {
    saveToStorage(boardData)
  }, [boardData])

  // Add a new column to the board
  const addColumn = useCallback((title) => {
    const id = generateId()
    setBoardData((prev) => ({
      ...prev,
      columns: { ...prev.columns, [id]: { id, title, cardIds: [] } },
      columnOrder: [...prev.columnOrder, id],
    }))
  }, [])

  // Rename an existing column
  const renameColumn = useCallback((columnId, newTitle) => {
    setBoardData((prev) => ({
      ...prev,
      columns: { ...prev.columns, [columnId]: { ...prev.columns[columnId], title: newTitle } },
    }))
  }, [])

  // Archive (delete) a column and all its cards
  const archiveColumn = useCallback((columnId) => {
    setBoardData((prev) => {
      const column = prev.columns[columnId]
      const newCards = { ...prev.cards }
      column.cardIds.forEach((cardId) => delete newCards[cardId])

      const newColumns = { ...prev.columns }
      delete newColumns[columnId]

      return {
        ...prev,
        columns: newColumns,
        columnOrder: prev.columnOrder.filter((id) => id !== columnId),
        cards: newCards,
      }
    })
  }, [])

  // Add a new card to a column
  const addCard = useCallback((columnId, title) => {
    const id = generateId()
    const newCard = {
      id,
      title,
      description: '',
      tags: [],
      createdAt: new Date().toISOString(),
    }

    setBoardData((prev) => ({
      ...prev,
      cards: { ...prev.cards, [id]: newCard },
      columns: {
        ...prev.columns,
        [columnId]: { ...prev.columns[columnId], cardIds: [...prev.columns[columnId].cardIds, id] },
      },
    }))
  }, [])

  // Update a card's details
  const updateCard = useCallback((cardId, updates) => {
    setBoardData((prev) => ({
      ...prev,
      cards: { ...prev.cards, [cardId]: { ...prev.cards[cardId], ...updates } },
    }))
  }, [])

  // Delete a card
  const deleteCard = useCallback((cardId, columnId) => {
    setBoardData((prev) => {
      const newCards = { ...prev.cards }
      delete newCards[cardId]

      return {
        ...prev,
        cards: newCards,
        columns: {
          ...prev.columns,
          [columnId]: {
            ...prev.columns[columnId],
            cardIds: prev.columns[columnId].cardIds.filter((id) => id !== cardId),
          },
        },
      }
    })
  }, [])

  // Move a card within or between columns
  const moveCard = useCallback((cardId, sourceColumnId, destColumnId, destIndex) => {
    setBoardData((prev) => {
      const sourceColumn = prev.columns[sourceColumnId]
      const destColumn = prev.columns[destColumnId]

      const sourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)

      let destCardIds
      if (sourceColumnId === destColumnId) {
        destCardIds = [...sourceCardIds]
        destCardIds.splice(destIndex, 0, cardId)
      } else {
        destCardIds = [...destColumn.cardIds]
        destCardIds.splice(destIndex, 0, cardId)
      }

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [sourceColumnId]: { ...sourceColumn, cardIds: sourceCardIds },
          ...(sourceColumnId !== destColumnId && { [destColumnId]: { ...destColumn, cardIds: destCardIds } }),
          ...(sourceColumnId === destColumnId && { [sourceColumnId]: { ...sourceColumn, cardIds: destCardIds } }),
        },
      }
    })
  }, [])

  // Open the card detail modal
  const openCardModal = useCallback((card, columnId) => {
    setSelectedCard({ ...card, columnId })
  }, [])

  // Close the card detail modal
  const closeCardModal = useCallback(() => {
    setSelectedCard(null)
  }, [])

  // Show a confirmation dialog
  const showConfirmDialog = useCallback((title, message, onConfirm) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm })
  }, [])

  // Close the confirmation dialog
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })
  }, [])

  return {
    boardData,
    selectedCard,
    confirmDialog,
    addColumn,
    renameColumn,
    archiveColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    openCardModal,
    closeCardModal,
    showConfirmDialog,
    closeConfirmDialog,
  }
}
