// Toolbar - Action buttons for board-level operations
import { useState } from 'react'
import PropTypes from 'prop-types'

function Toolbar({ onAddColumn }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newTitle.trim()) {
      onAddColumn(newTitle.trim())
      setNewTitle('')
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setNewTitle('')
    setIsAdding(false)
  }

  return (
    <div
      className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 lg:px-8"
      data-testid="toolbar"
    >
      <div className="mx-auto max-w-7xl">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            data-testid="add-column-button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add List
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter list title..."
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              data-testid="new-column-input"
            />
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              data-testid="save-column-button"
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              data-testid="cancel-column-button"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

Toolbar.propTypes = {
  onAddColumn: PropTypes.func.isRequired,
}

export default Toolbar
