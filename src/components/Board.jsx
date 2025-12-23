// Board - Main Kanban board with drag-and-drop
import { useState, memo, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import PropTypes from 'prop-types'
import ListColumn from './ListColumn'
import Card from './Card'

function Board({
  boardData,
  onMoveCard,
  onRenameColumn,
  onArchiveColumn,
  onAddCard,
  onCardClick,
  onDeleteCard,
}) {
  const [activeCard, setActiveCard] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Find which column contains a card
  const findColumnByCardId = useCallback(
    (cardId) => {
      for (const [columnId, column] of Object.entries(boardData.columns)) {
        if (column.cardIds.includes(cardId)) return columnId
      }
      return null
    },
    [boardData.columns]
  )

  const handleDragStart = useCallback(
    (event) => {
      const card = boardData.cards[event.active.id]
      if (card) setActiveCard(card)
    },
    [boardData.cards]
  )

  // Handle card drop and move
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      setActiveCard(null)

      if (!over) return

      const activeId = active.id
      const overId = over.id
      const sourceColumnId = findColumnByCardId(activeId)
      if (!sourceColumnId) return

      let destColumnId, destIndex

      if (boardData.cards[overId]) {
        destColumnId = findColumnByCardId(overId)
        destIndex = boardData.columns[destColumnId].cardIds.indexOf(overId)
      } else if (boardData.columns[overId]) {
        destColumnId = overId
        destIndex = boardData.columns[overId].cardIds.length
      } else {
        return
      }

      if (sourceColumnId === destColumnId) {
        const sourceIndex = boardData.columns[sourceColumnId].cardIds.indexOf(activeId)
        if (sourceIndex === destIndex) return
      }

      onMoveCard(activeId, sourceColumnId, destColumnId, destIndex)
    },
    [boardData.cards, boardData.columns, findColumnByCardId, onMoveCard]
  )

  const columnsWithCards = useMemo(
    () =>
      boardData.columnOrder.map((columnId) => {
        const column = boardData.columns[columnId]
        const cards = column.cardIds.map((cardId) => boardData.cards[cardId]).filter(Boolean)
        return { column, cards }
      }),
    [boardData.columnOrder, boardData.columns, boardData.cards]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex flex-1 gap-4 overflow-x-auto p-4 sm:p-6"
        data-testid="board"
        role="region"
        aria-label="Kanban board"
      >
        {columnsWithCards.map(({ column, cards }) => (
          <ListColumn
            key={column.id}
            column={column}
            cards={cards}
            onRename={onRenameColumn}
            onArchive={onArchiveColumn}
            onAddCard={onAddCard}
            onCardClick={onCardClick}
            onDeleteCard={onDeleteCard}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 opacity-90">
            <Card card={activeCard} columnId="" onClick={() => {}} onDelete={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

Board.propTypes = {
  boardData: PropTypes.shape({
    columns: PropTypes.object.isRequired,
    columnOrder: PropTypes.arrayOf(PropTypes.string).isRequired,
    cards: PropTypes.object.isRequired,
  }).isRequired,
  onMoveCard: PropTypes.func.isRequired,
  onRenameColumn: PropTypes.func.isRequired,
  onArchiveColumn: PropTypes.func.isRequired,
  onAddCard: PropTypes.func.isRequired,
  onCardClick: PropTypes.func.isRequired,
  onDeleteCard: PropTypes.func.isRequired,
}

export default memo(Board)
