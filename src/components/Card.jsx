// Card - Draggable task card component
import { memo, useMemo, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PropTypes from 'prop-types'

const TAG_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  bug: 'bg-orange-100 text-orange-700',
  design: 'bg-purple-100 text-purple-700',
  'tech-debt': 'bg-yellow-100 text-yellow-700',
  backend: 'bg-green-100 text-green-700',
  frontend: 'bg-cyan-100 text-cyan-700',
  devops: 'bg-indigo-100 text-indigo-700',
  default: 'bg-gray-100 text-gray-700',
}

const getTagColor = (tag) => TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default

function Card({ card, columnId, onClick, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card, columnId },
  })

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, transition, isDragging]
  )

  const handleCardClick = useCallback(() => onClick(card, columnId), [onClick, card, columnId])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick(card, columnId)
    },
    [onClick, card, columnId]
  )

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation()
      onDelete(card.id, columnId)
    },
    [onDelete, card.id, columnId]
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'ring-2 ring-blue-400' : 'border-gray-200'
      }`}
      data-testid={`card-${card.id}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        aria-label={`Drag ${card.title}`}
      />

      <div
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="relative z-10 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Edit ${card.title}`}
      >
        <h4 className="mb-1 font-medium text-gray-900">{card.title}</h4>

        {card.description && (
          <p className="mb-2 line-clamp-2 text-sm text-gray-500">{card.description}</p>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 z-20 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        aria-label={`Delete ${card.title}`}
        data-testid={`delete-card-${card.id}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

Card.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  columnId: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

function arePropsEqual(prevProps, nextProps) {
  if (prevProps.card.id !== nextProps.card.id) return false
  if (prevProps.card.title !== nextProps.card.title) return false
  if (prevProps.card.description !== nextProps.card.description) return false
  if (prevProps.columnId !== nextProps.columnId) return false
  const prevTags = prevProps.card.tags || []
  const nextTags = nextProps.card.tags || []
  if (prevTags.length !== nextTags.length) return false
  for (let i = 0; i < prevTags.length; i++) {
    if (prevTags[i] !== nextTags[i]) return false
  }
  return true
}

export default memo(Card, arePropsEqual)
