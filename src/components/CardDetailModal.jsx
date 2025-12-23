/**
 * CardDetailModal Component
 *
 * A modal dialog for viewing and editing card details.
 * Supports editing title, description, and tags.
 *
 * HOW THE MODAL WORKS:
 * ===================
 * 1. OPENING: When user clicks a Card, App calls openCardModal(card, columnId)
 *    - useBoard hook sets selectedCard state
 *    - App passes selectedCard to CardDetailModal
 *    - Modal renders when selectedCard is not null
 *
 * 2. EDITING: User modifies fields in the modal
 *    - Local state tracks changes (editTitle, editDescription, editTags)
 *    - Changes don't affect the board until user clicks "Save"
 *
 * 3. SAVING: User clicks "Save Changes"
 *    - Modal calls onSave(cardId, { title, description, tags })
 *    - App passes this to useBoard.updateCard()
 *    - Board state updates, modal closes
 *
 * 4. CLOSING: User clicks outside, presses Escape, or clicks X
 *    - onClose() is called
 *    - selectedCard is set to null
 *    - Modal unmounts
 *
 * PROPS:
 * @param {Object} card - The card being edited { id, title, description, tags, columnId }
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onSave - Callback to save changes
 * @param {Function} onDelete - Callback to delete the card
 */

import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

function CardDetailModal({ card, onClose, onSave, onDelete }) {
  // Local state for editing - initialized from card props
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDescription, setEditDescription] = useState(card.description || '')
  const [editTags, setEditTags] = useState(card.tags?.join(', ') || '')

  // Ref for focusing the title input on open
  const titleInputRef = useRef(null)

  // Focus title input when modal opens
  useEffect(() => {
    titleInputRef.current?.focus()
  }, [])

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleSave = () => {
    if (!editTitle.trim()) {
      return // Don't save empty titles
    }

    // Parse tags from comma-separated string
    const tagsArray = editTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    onSave(card.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      tags: tagsArray,
    })
    onClose()
  }

  const handleDelete = () => {
    onDelete(card.id, card.columnId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="card-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            Edit Card
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
            data-testid="close-modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-4">
          {/* Title Field */}
          <div>
            <label htmlFor="card-title" className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              ref={titleInputRef}
              id="card-title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter card title..."
              data-testid="card-title-input"
            />
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="card-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="card-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add a more detailed description..."
              data-testid="card-description-input"
            />
          </div>

          {/* Tags Field */}
          <div>
            <label htmlFor="card-tags" className="mb-1 block text-sm font-medium text-gray-700">
              Tags
              <span className="ml-1 text-xs font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              id="card-tags"
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="urgent, feature, bug..."
              data-testid="card-tags-input"
            />
            <p className="mt-1 text-xs text-gray-500">Suggested: urgent, feature, bug, design</p>
          </div>

          {/* Card Metadata */}
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            <p>
              <span className="font-medium">Card ID:</span> {card.id.slice(0, 8)}...
            </p>
            {card.createdAt && (
              <p>
                <span className="font-medium">Created:</span>{' '}
                {new Date(card.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 p-4">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            data-testid="delete-card-modal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              data-testid="cancel-modal"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              data-testid="save-card-button"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

CardDetailModal.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    columnId: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

export default CardDetailModal
