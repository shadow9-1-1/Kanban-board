// ConfirmDialog - Confirmation dialog for destructive actions
import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useFocusTrap } from '../hooks/useAccessibility'

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  const cancelButtonRef = useRef(null)

  const { containerRef } = useFocusTrap({
    isActive: isOpen,
    onEscape: onCancel,
    autoFocus: false,
    restoreFocus: true,
  })

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      requestAnimationFrame(() => {
        cancelButtonRef.current?.focus()
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onCancel()
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
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div ref={containerRef} className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100" aria-hidden="true">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 id="confirm-title" className="mb-2 text-center text-lg font-semibold text-gray-900">
          {title}
        </h3>

        <p id="confirm-message" className="mb-6 text-center text-sm text-gray-600">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            data-testid="confirm-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            data-testid="confirm-action"
          >
            Confirm
          </button>
        </div>

        <p className="sr-only">Press Escape to cancel, or Tab to navigate between buttons.</p>
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
