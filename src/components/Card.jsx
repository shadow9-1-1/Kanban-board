/**
 * Card Component
 *
 * Represents a single task card in the Kanban board.
 * Supports drag-and-drop via dnd-kit's useSortable hook.
 *
 * DRAG & DROP EXPLANATION:
 * 1. useSortable(id) returns attributes and listeners for drag handling
 * 2. attributes: Props for accessibility (role, tabindex, etc.)
 * 3. listeners: Event handlers for drag start (onPointerDown, etc.)
 * 4. setNodeRef: Ref callback to register this element with dnd-kit
 * 5. transform: CSS transform applied during drag
 * 6. transition: CSS transition for smooth animations
 * 7. isDragging: Boolean to style the dragged item differently
 *
 * PROPS:
 * @param {Object} card - Card data { id, title, description, tags }
 * @param {string} columnId - Parent column ID (needed for delete/move)
 * @param {Function} onClick - Opens the CardDetailModal
 * @param {Function} onDelete - Deletes this card
 */

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PropTypes from 'prop-types'

function Card({ card, columnId, onClick, onDelete }) {
  // dnd-kit sortable hook - makes this card draggable
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      columnId,
    },
  })

  // Apply transform and transition styles during drag
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Tag color mapping
  const tagColors = {
    urgent: 'bg-red-100 text-red-700',
    feature: 'bg-blue-100 text-blue-700',
    bug: 'bg-orange-100 text-orange-700',
    design: 'bg-purple-100 text-purple-700',
    default: 'bg-gray-100 text-gray-700',
  }

  const getTagColor = (tag) => tagColors[tag.toLowerCase()] || tagColors.default

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'ring-2 ring-blue-400' : 'border-gray-200'
      }`}
      data-testid={`card-${card.id}`}
    >
      {/* Drag Handle - entire card is draggable */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        aria-label={`Drag ${card.title}`}
      />

      {/* Card Content - clickable for editing */}
      <div
        onClick={() => onClick(card, columnId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick(card, columnId)
          }
        }}
        className="relative z-10 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Edit ${card.title}`}
      >
        {/* Card Title */}
        <h4 className="mb-1 font-medium text-gray-900">{card.title}</h4>

        {/* Card Description Preview */}
        {card.description && (
          <p className="mb-2 line-clamp-2 text-sm text-gray-500">{card.description}</p>
        )}

        {/* Tags */}
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

      {/* Delete Button - appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(card.id, columnId)
        }}
        className="absolute right-2 top-2 z-20 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        aria-label={`Delete ${card.title}`}
        data-testid={`delete-card-${card.id}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
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

export default Card
