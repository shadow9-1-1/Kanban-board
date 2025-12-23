/**
 * useBoard Hook
 *
 * Custom hook that manages all Kanban board state and operations.
 * This centralizes the logic for columns, cards, and drag-drop handling.
 *
 * HOW STATE FLOWS:
 * 1. Initial load: Check localStorage → fallback to createInitialData()
 * 2. User actions: Call handler functions (addCard, moveCard, etc.)
 * 3. State updates: React re-renders affected components
 * 4. Persistence: useEffect saves to localStorage on every change
 *
 * COMPONENT COMMUNICATION:
 * - App provides this hook's values via props to child components
 * - Children call handlers (passed as props) to modify state
 * - State changes flow down, events flow up (unidirectional data flow)
 */

import { useState, useEffect, useCallback } from 'react'
import { generateId, createInitialData, saveToStorage, loadFromStorage } from '../utils'

export const useBoard = () => {
  // Initialize state from localStorage or create fresh board
  const [boardData, setBoardData] = useState(() => {
    const saved = loadFromStorage()
    return saved || createInitialData()
  })

  // Track which card is being edited in the modal
  const [selectedCard, setSelectedCard] = useState(null)

  // Track confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  // Persist to localStorage whenever boardData changes
  useEffect(() => {
    saveToStorage(boardData)
  }, [boardData])

  // ==================== COLUMN OPERATIONS ====================

  /**
   * Add a new column to the board
   * @param {string} title - The column title
   */
  const addColumn = useCallback((title) => {
    const id = generateId()
    setBoardData((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [id]: { id, title, cardIds: [] },
      },
      columnOrder: [...prev.columnOrder, id],
    }))
  }, [])

  /**
   * Rename an existing column
   * @param {string} columnId - The column to rename
   * @param {string} newTitle - The new title
   */
  const renameColumn = useCallback((columnId, newTitle) => {
    setBoardData((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [columnId]: { ...prev.columns[columnId], title: newTitle },
      },
    }))
  }, [])

  /**
   * Archive (delete) a column and all its cards
   * @param {string} columnId - The column to archive
   */
  const archiveColumn = useCallback((columnId) => {
    setBoardData((prev) => {
      const column = prev.columns[columnId]
      const newCards = { ...prev.cards }

      // Remove all cards in this column
      column.cardIds.forEach((cardId) => {
        delete newCards[cardId]
      })

      // Remove column from columns object
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

  // ==================== CARD OPERATIONS ====================

  /**
   * Add a new card to a column
   * @param {string} columnId - The column to add the card to
   * @param {string} title - The card title
   */
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
        [columnId]: {
          ...prev.columns[columnId],
          cardIds: [...prev.columns[columnId].cardIds, id],
        },
      },
    }))
  }, [])

  /**
   * Update a card's details
   * @param {string} cardId - The card to update
   * @param {Object} updates - Object with fields to update (title, description, tags)
   */
  const updateCard = useCallback((cardId, updates) => {
    setBoardData((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], ...updates },
      },
    }))
  }, [])

  /**
   * Delete a card
   * @param {string} cardId - The card to delete
   * @param {string} columnId - The column containing the card
   */
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

  // ==================== DRAG & DROP ====================

  /**
   * Move a card within the same column or to a different column
   *
   * HOW DRAG & DROP WORKS WITH DND-KIT:
   * 1. DndContext wraps the board and tracks drag state
   * 2. When user starts dragging, onDragStart fires (optional visual feedback)
   * 3. When user drops, onDragEnd fires with { active, over } objects
   * 4. active.id = the dragged item's ID
   * 5. over.id = the drop target's ID (card or column)
   * 6. We determine source/destination columns and reorder cardIds arrays
   *
   * @param {string} cardId - The card being moved
   * @param {string} sourceColumnId - Where the card came from
   * @param {string} destColumnId - Where the card is going
   * @param {number} destIndex - Position in the destination column
   */
  const moveCard = useCallback((cardId, sourceColumnId, destColumnId, destIndex) => {
    setBoardData((prev) => {
      const sourceColumn = prev.columns[sourceColumnId]
      const destColumn = prev.columns[destColumnId]

      // Remove card from source
      const sourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)

      // Add card to destination at specific index
      let destCardIds
      if (sourceColumnId === destColumnId) {
        // Same column - just reorder
        destCardIds = [...sourceCardIds]
        destCardIds.splice(destIndex, 0, cardId)
      } else {
        // Different column
        destCardIds = [...destColumn.cardIds]
        destCardIds.splice(destIndex, 0, cardId)
      }

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [sourceColumnId]: { ...sourceColumn, cardIds: sourceCardIds },
          ...(sourceColumnId !== destColumnId && {
            [destColumnId]: { ...destColumn, cardIds: destCardIds },
          }),
          ...(sourceColumnId === destColumnId && {
            [sourceColumnId]: { ...sourceColumn, cardIds: destCardIds },
          }),
        },
      }
    })
  }, [])

  // ==================== MODAL & DIALOG HELPERS ====================

  /**
   * Open the card detail modal
   * @param {Object} card - The card to edit
   * @param {string} columnId - The column containing the card
   */
  const openCardModal = useCallback((card, columnId) => {
    setSelectedCard({ ...card, columnId })
  }, [])

  /**
   * Close the card detail modal
   */
  const closeCardModal = useCallback(() => {
    setSelectedCard(null)
  }, [])

  /**
   * Show a confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Function} onConfirm - Callback when user confirms
   */
  const showConfirmDialog = useCallback((title, message, onConfirm) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm })
  }, [])

  /**
   * Close the confirmation dialog
   */
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })
  }, [])

  return {
    // State
    boardData,
    selectedCard,
    confirmDialog,

    // Column operations
    addColumn,
    renameColumn,
    archiveColumn,

    // Card operations
    addCard,
    updateCard,
    deleteCard,
    moveCard,

    // Modal/dialog
    openCardModal,
    closeCardModal,
    showConfirmDialog,
    closeConfirmDialog,
  }
}
