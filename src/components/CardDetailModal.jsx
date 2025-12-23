// CardDetailModal - Modal for viewing and editing card details
import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useFocusTrap } from '../hooks/useAccessibility'

function CardDetailModal({ card, onClose, onSave, onDelete }) {
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDescription, setEditDescription] = useState(card.description || '')
  const [editTags, setEditTags] = useState(card.tags?.join(', ') || '')
  const [errors, setErrors] = useState({})

  const { containerRef } = useFocusTrap({
    isActive: true,
    onEscape: onClose,
    autoFocus: true,
    restoreFocus: true,
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const validateTitle = useCallback((value) => {
    if (!value.trim()) return 'Title is required'
    if (value.trim().length < 2) return 'Title must be at least 2 characters'
    return null
  }, [])

  const handleSave = () => {
    const titleError = validateTitle(editTitle)
    if (titleError) {
      setErrors({ title: titleError })
      return
    }

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="card-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            Edit Card
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Close modal"
            data-testid="close-modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p id="modal-description" className="sr-only">
          Edit the card title, description, and tags. Press Escape to close without saving.
        </p>

        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="card-title" className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="card-title"
              type="text"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value)
                if (errors.title) setErrors({})
              }}
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="Enter card title..."
              aria-required="true"
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'title-error' : undefined}
              data-testid="card-title-input"
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="card-description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="card-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a more detailed description..."
              data-testid="card-description-input"
            />
          </div>

          <div>
            <label htmlFor="card-tags" className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
            <input
              id="card-tags"
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="urgent, feature, bug..."
              aria-describedby="tags-hint"
              data-testid="card-tags-input"
            />
            <p id="tags-hint" className="mt-1 text-xs text-gray-600">
              Separate tags with commas.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <p><span className="font-medium">Card ID:</span> {card.id.slice(0, 8)}...</p>
            {card.createdAt && (
              <p><span className="font-medium">Created:</span> {new Date(card.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            data-testid="delete-card-modal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              data-testid="cancel-modal"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
