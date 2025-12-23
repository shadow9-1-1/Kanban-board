// useBoardState - Enhanced wrapper for board state with selectors and actions
import { useContext, useCallback, useMemo } from 'react'
import { BoardStateContext, BoardDispatchContext } from '../context/BoardContext'
import { ActionTypes } from '../context/boardActions'
import { generateId } from '../utils'

// Access raw state context
const useStateContext = () => {
  const context = useContext(BoardStateContext)
  if (context === null) throw new Error('useBoardState must be used within a BoardProvider')
  return context
}

// Access raw dispatch context
const useDispatchContext = () => {
  const context = useContext(BoardDispatchContext)
  if (context === null) throw new Error('useBoardState must be used within a BoardProvider')
  return context
}

// Comprehensive hook for board state management
export const useBoardState = () => {
  const state = useStateContext()
  const dispatch = useDispatchContext()
  const { board, ui } = state

  // Memoized selectors for efficient data access
  const selectors = useMemo(() => ({
    getColumn: (columnId) => board?.columns?.[columnId] || null,
    getCard: (cardId) => board?.cards?.[cardId] || null,
    getCardsInColumn: (columnId) => {
      const column = board?.columns?.[columnId]
      if (!column) return []
      return (column.cardIds || []).map((id) => board.cards[id]).filter(Boolean)
    },
    getColumnForCard: (cardId) => {
      if (!board?.columns) return null
      for (const column of Object.values(board.columns)) {
        if (column.cardIds?.includes(cardId)) return column
      }
      return null
    },
    searchCards: (query) => {
      if (!query || query.trim() === '' || !board?.columns) return []
      const lowerQuery = query.toLowerCase()
      const results = []
      for (const [columnId, column] of Object.entries(board.columns)) {
        for (const cardId of column.cardIds || []) {
          const card = board.cards?.[cardId]
          if (card && ((card.title || '').toLowerCase().includes(lowerQuery) || (card.description || '').toLowerCase().includes(lowerQuery) || (card.tags || []).some((tag) => tag.toLowerCase().includes(lowerQuery)))) {
            results.push({ ...card, columnId })
          }
        }
      }
      return results
    },
    getCardsByTag: (tag) => {
      if (!board?.columns) return []
      const results = []
      for (const [columnId, column] of Object.entries(board.columns)) {
        for (const cardId of column.cardIds || []) {
          const card = board.cards?.[cardId]
          if (card && (card.tags || []).includes(tag)) results.push({ ...card, columnId })
        }
      }
      return results
    },
    getAllTags: () => {
      if (!board?.cards) return []
      const tagSet = new Set()
      for (const card of Object.values(board.cards)) (card.tags || []).forEach((tag) => tagSet.add(tag))
      return Array.from(tagSet).sort()
    },
    getOrderedColumns: () => {
      if (!board?.columnOrder || !board?.columns) return []
      return board.columnOrder.map((id) => board.columns[id]).filter(Boolean)
    },
  }), [board])

  // Memoized computed/derived values
  const computed = useMemo(() => ({
    columnCount: board?.columnOrder?.length || 0,
    totalCardCount: board?.cards ? Object.keys(board.cards).length : 0,
    cardCountByColumn: board?.columns ? Object.fromEntries(Object.entries(board.columns).map(([id, col]) => [id, col.cardIds?.length || 0])) : {},
    isEmpty: !board?.columnOrder || board.columnOrder.length === 0,
    hasCards: board?.cards ? Object.keys(board.cards).length > 0 : false,
    version: board?.version || 1,
    lastModifiedAt: board?.lastModifiedAt || null,
    isModalOpen: ui.selectedCard !== null,
    isDialogOpen: ui.confirmDialog?.isOpen || false,
    isConflictOpen: ui.conflictDialog?.isOpen || false,
  }), [board, ui])

  // Pre-bound action dispatchers
  const actions = useMemo(() => {
    const addColumn = (title) => { const id = generateId(); dispatch({ type: ActionTypes.COLUMN_ADD, payload: { id, title } }); return id }
    const renameColumn = (columnId, title) => dispatch({ type: ActionTypes.COLUMN_RENAME, payload: { columnId, title } })
    const archiveColumn = (columnId) => dispatch({ type: ActionTypes.COLUMN_ARCHIVE, payload: { columnId } })
    const addCard = (columnId, cardData) => {
      const id = generateId()
      const card = { id, title: cardData.title, description: cardData.description || '', tags: cardData.tags || [], createdAt: new Date().toISOString() }
      dispatch({ type: ActionTypes.CARD_ADD, payload: { columnId, card } })
      return id
    }
    const updateCard = (cardId, updates) => dispatch({ type: ActionTypes.CARD_UPDATE, payload: { cardId, updates } })
    const deleteCard = (cardId, columnId) => dispatch({ type: ActionTypes.CARD_DELETE, payload: { cardId, columnId } })
    const moveCard = (cardId, sourceColumnId, destColumnId, destIndex) => dispatch({ type: ActionTypes.CARD_MOVE, payload: { cardId, sourceColumnId, destColumnId, destIndex } })
    const openModal = (card, columnId) => dispatch({ type: ActionTypes.MODAL_OPEN, payload: { card: { ...card, columnId } } })
    const closeModal = () => dispatch({ type: ActionTypes.MODAL_CLOSE })
    const showDialog = (title, message, onConfirm) => dispatch({ type: ActionTypes.DIALOG_SHOW, payload: { title, message, onConfirm } })
    const hideDialog = () => dispatch({ type: ActionTypes.DIALOG_HIDE })
    const loadBoard = (data) => dispatch({ type: ActionTypes.BOARD_LOAD, payload: { data } })
    const resetBoard = () => dispatch({ type: ActionTypes.BOARD_RESET })
    return { addColumn, renameColumn, archiveColumn, addCard, updateCard, deleteCard, moveCard, openModal, closeModal, showDialog, hideDialog, loadBoard, resetBoard, dispatch }
  }, [dispatch])

  // Batch operations
  const batch = useMemo(() => ({
    moveCardsToColumn: (cardIds, destColumnId) => {
      cardIds.forEach((cardId, index) => {
        const sourceColumn = selectors.getColumnForCard(cardId)
        if (sourceColumn) actions.moveCard(cardId, sourceColumn.id, destColumnId, index)
      })
    },
    deleteCards: (cards) => cards.forEach(({ cardId, columnId }) => actions.deleteCard(cardId, columnId)),
    addCards: (columnId, cardsData) => cardsData.map((cardData) => actions.addCard(columnId, cardData)),
    clearColumn: (columnId) => {
      const column = selectors.getColumn(columnId)
      if (column) (column.cardIds || []).forEach((cardId) => actions.deleteCard(cardId, columnId))
    },
  }), [selectors, actions])

  return {
    board, ui,
    columns: board?.columns || {},
    cards: board?.cards || {},
    columnOrder: board?.columnOrder || [],
    selectedCard: ui?.selectedCard || null,
    selectors, computed, actions, batch,
    dispatch: actions.dispatch,
  }
}

export default useBoardState
