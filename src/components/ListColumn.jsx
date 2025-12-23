// ListColumn - Droppable column containing cards
import { useState, memo, useCallback, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import PropTypes from 'prop-types'
import Card from './Card'
import VirtualizedCardList, { VIRTUALIZATION_THRESHOLD } from './VirtualizedCardList'

function ListColumn({ column, cards, onRename, onArchive, onAddCard, onCardClick, onDeleteCard }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  })

  const cardIds = useMemo(() => cards.map((c) => c.id), [cards])
  const shouldVirtualize = cards.length > VIRTUALIZATION_THRESHOLD

  const handleRename = useCallback(() => {
    if (editTitle.trim() && editTitle !== column.title) {
      onRename(column.id, editTitle.trim())
    }
    setIsEditing(false)
  }, [editTitle, column.title, column.id, onRename])

  const handleAddCard = useCallback(
    (e) => {
      e.preventDefault()
      if (newCardTitle.trim()) {
        onAddCard(column.id, { title: newCardTitle.trim() })
        setNewCardTitle('')
        setIsAddingCard(false)
      }
    },
    [newCardTitle, column.id, onAddCard]
  )

  const handleRenameKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleRename()
      if (e.key === 'Escape') {
        setEditTitle(column.title)
        setIsEditing(false)
      }
    },
    [handleRename, column.title]
  )

  const handleTitleClick = useCallback(() => setIsEditing(true), [])
  const handleMenuToggle = useCallback(() => setShowMenu((prev) => !prev), [])
  const handleMenuClose = useCallback(() => setShowMenu(false), [])
  const handleRenameMenuClick = useCallback(() => {
    setIsEditing(true)
    setShowMenu(false)
  }, [])
  const handleArchiveClick = useCallback(() => {
    onArchive(column.id)
    setShowMenu(false)
  }, [onArchive, column.id])
  const handleCancelAddCard = useCallback(() => {
    setNewCardTitle('')
    setIsAddingCard(false)
  }, [])
  const handleStartAddCard = useCallback(() => setIsAddingCard(true), [])

  return (
    <div
      className={`flex h-fit max-h-full w-72 flex-shrink-0 flex-col rounded-xl bg-gray-100 ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-center justify-between p-3">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleRenameKeyDown}
            className="w-full rounded border-none bg-white px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            data-testid={`rename-column-input-${column.id}`}
          />
        ) : (
          <h3
            className="cursor-pointer font-semibold text-gray-700"
            onClick={handleTitleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
            data-testid={`column-title-${column.id}`}
          >
            {column.title}
            <span className="ml-2 text-sm font-normal text-gray-400">({cards.length})</span>
          </h3>
        )}

        <div className="relative">
          <button
            onClick={handleMenuToggle}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            aria-label="Column menu"
            data-testid={`column-menu-${column.id}`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleRenameMenuClick}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                data-testid={`rename-column-${column.id}`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Rename
              </button>
              <button
                onClick={handleArchiveClick}
                className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                data-testid={`archive-column-${column.id}`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive List
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0"
        style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '100px' }}
        data-testid={`column-cards-${column.id}`}
      >
        {shouldVirtualize ? (
          <VirtualizedCardList
            cards={cards}
            columnId={column.id}
            height={Math.min(cards.length * 108, 500)}
            onCardClick={onCardClick}
            onDeleteCard={onDeleteCard}
          />
        ) : (
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                columnId={column.id}
                onClick={onCardClick}
                onDelete={onDeleteCard}
              />
            ))}
          </SortableContext>
        )}

        {cards.length === 0 && !isAddingCard && (
          <div className="py-4 text-center text-sm text-gray-400">No cards yet</div>
        )}
      </div>

      <div className="p-2 pt-0">
        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="space-y-2">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter card title..."
              className="w-full resize-none rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              autoFocus
              data-testid={`new-card-input-${column.id}`}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                data-testid={`save-card-${column.id}`}
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={handleCancelAddCard}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
                data-testid={`cancel-card-${column.id}`}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={handleStartAddCard}
            className="flex w-full items-center gap-1 rounded-lg p-2 text-sm text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
            data-testid={`add-card-button-${column.id}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add a card
          </button>
        )}
      </div>

      {showMenu && <div className="fixed inset-0 z-10" onClick={handleMenuClose} aria-hidden="true" />}
    </div>
  )
}

ListColumn.propTypes = {
  column: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    cardIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })
  ).isRequired,
  onRename: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onAddCard: PropTypes.func.isRequired,
  onCardClick: PropTypes.func.isRequired,
  onDeleteCard: PropTypes.func.isRequired,
}

export default memo(ListColumn)
