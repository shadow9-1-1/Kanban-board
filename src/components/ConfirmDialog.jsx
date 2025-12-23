/**
 * ConfirmDialog Component
 *
 * A reusable confirmation dialog for destructive actions.
 * Used when archiving columns or deleting cards.
 *
 * USAGE PATTERN:
 * 1. Parent component calls showConfirmDialog(title, message, onConfirm)
 * 2. Dialog appears with the message
 * 3. User clicks "Confirm" → onConfirm() executes, dialog closes
 * 4. User clicks "Cancel" → dialog closes, no action taken
 *
 * PROPS:
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {string} title - Dialog title
 * @param {string} message - Explanation of what will happen
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback to close the dialog
 */

import { useEffect } from 'react'
import PropTypes from 'prop-types'

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  // Handle keyboard events (Escape to cancel)
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Don't render if not open
  if (!isOpen) {
    return null
  }

  const handleConfirm = () => {
    onConfirm()
    onCancel() // Close the dialog
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog Content */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Warning Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 id="confirm-title" className="mb-2 text-center text-lg font-semibold text-gray-900">
          {title}
        </h3>

        {/* Message */}
        <p id="confirm-message" className="mb-6 text-center text-sm text-gray-500">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="confirm-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            data-testid="confirm-action"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
}

ConfirmDialog.defaultProps = {
  onConfirm: () => {},
}

export default ConfirmDialog
