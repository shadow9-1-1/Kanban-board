/**
 * Board Component
 *
 * The main Kanban board container that orchestrates drag-and-drop.
 *
 * DND-KIT ARCHITECTURE EXPLANATION:
 * ================================
 *
 * 1. DndContext - The root provider that tracks all drag state
 *    - sensors: Define how drags are initiated (pointer, keyboard, touch)
 *    - collisionDetection: Algorithm to determine what's being hovered
 *    - onDragStart: Called when drag begins (for visual feedback)
 *    - onDragEnd: Called when drag ends (to persist the move)
 *
 * 2. Sensors - Input methods for dragging
 *    - PointerSensor: Mouse/touch with activation distance
 *    - KeyboardSensor: Arrow keys for accessibility
 *
 * 3. Collision Detection - closestCorners works best for Kanban
 *    - Checks which droppable area the dragged item is closest to
 *    - Handles both column drops and card reordering
 *
 * 4. Data Flow on Drop:
 *    a. onDragEnd receives { active, over }
 *    b. active.id = dragged card's ID
 *    c. over.id = drop target (card ID or column ID)
 *    d. We extract columnId from the sortable data
 *    e. Calculate new index and call moveCard()
 *
 * PROPS:
 * @param {Object} boardData - { columns, columnOrder, cards }
 * @param {Function} onMoveCard - Callback to move card
 * @param {Function} onRenameColumn - Callback to rename column
 * @param {Function} onArchiveColumn - Callback to archive column
 * @param {Function} onAddCard - Callback to add card
 * @param {Function} onCardClick - Callback when card is clicked
 * @param {Function} onDeleteCard - Callback to delete card
 */

import { useState } from 'react'
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
  // Track the currently dragged card for the overlay
  const [activeCard, setActiveCard] = useState(null)

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px of movement before drag starts
      // This prevents accidental drags when clicking
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      // Enable keyboard navigation for accessibility
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /**
   * Find which column contains a specific card
   * @param {string} cardId - The card ID to find
   * @returns {string|null} The column ID or null
   */
  const findColumnByCardId = (cardId) => {
    for (const [columnId, column] of Object.entries(boardData.columns)) {
      if (column.cardIds.includes(cardId)) {
        return columnId
      }
    }
    return null
  }

  /**
   * Handle drag start - set active card for overlay
   */
  const handleDragStart = (event) => {
    const { active } = event
    const card = boardData.cards[active.id]
    if (card) {
      setActiveCard(card)
    }
  }

  /**
   * Handle drag end - move the card to its new position
   *
   * LOGIC BREAKDOWN:
   * 1. Get the dragged item (active) and drop target (over)
   * 2. If no valid drop target, cancel
   * 3. Determine source column (where card came from)
   * 4. Determine destination column and index:
   *    - If dropped on a card, insert before/after that card
   *    - If dropped on empty column area, append to end
   * 5. Call onMoveCard with all the info
   */
  const handleDragEnd = (event) => {
    const { active, over } = event

    // Clear the drag overlay
    setActiveCard(null)

    // No valid drop target
    if (!over) {
      return
    }

    const activeId = active.id
    const overId = over.id

    // Find source column
    const sourceColumnId = findColumnByCardId(activeId)
    if (!sourceColumnId) {
      return
    }

    // Determine destination column and index
    let destColumnId
    let destIndex

    // Check if dropped on another card
    if (boardData.cards[overId]) {
      // Dropped on a card - find its column
      destColumnId = findColumnByCardId(overId)
      const destColumn = boardData.columns[destColumnId]
      destIndex = destColumn.cardIds.indexOf(overId)

      // If dropping after the target card in the same column
      // No adjustment needed - we insert at the target position
    } else if (boardData.columns[overId]) {
      // Dropped on a column (empty area)
      destColumnId = overId
      destIndex = boardData.columns[overId].cardIds.length
    } else {
      return
    }

    // Only move if something actually changed
    if (sourceColumnId === destColumnId) {
      const sourceColumn = boardData.columns[sourceColumnId]
      const sourceIndex = sourceColumn.cardIds.indexOf(activeId)
      if (sourceIndex === destIndex) {
        return
      }
    }

    onMoveCard(activeId, sourceColumnId, destColumnId, destIndex)
  }

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
        {boardData.columnOrder.map((columnId) => {
          const column = boardData.columns[columnId]
          const cards = column.cardIds.map((cardId) => boardData.cards[cardId]).filter(Boolean)

          return (
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
          )
        })}
      </div>

      {/* Drag Overlay - Shows a preview of the dragged card */}
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

export default Board
