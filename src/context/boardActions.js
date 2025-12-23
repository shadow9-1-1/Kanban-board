/**
 * Board Reducer - Action Types
 *
 * All possible actions that can modify the board state.
 * Using constants prevents typos and enables autocomplete.
 *
 * ACTION NAMING CONVENTION:
 * - ENTITY_VERB format (e.g., COLUMN_ADD, CARD_DELETE)
 * - Past tense not used - actions describe intent, not result
 */

export const ActionTypes = {
  // ==================== BOARD ACTIONS ====================
  BOARD_LOAD: 'BOARD_LOAD', // Load entire board from storage
  BOARD_RESET: 'BOARD_RESET', // Reset to initial state
  BOARD_SET_VERSION: 'BOARD_SET_VERSION', // Set board version number

  // ==================== COLUMN ACTIONS ====================
  COLUMN_ADD: 'COLUMN_ADD', // Add a new column
  COLUMN_RENAME: 'COLUMN_RENAME', // Rename an existing column
  COLUMN_ARCHIVE: 'COLUMN_ARCHIVE', // Archive (delete) a column
  COLUMN_REORDER: 'COLUMN_REORDER', // Reorder columns (future feature)

  // ==================== CARD ACTIONS ====================
  CARD_ADD: 'CARD_ADD', // Add a new card to a column
  CARD_UPDATE: 'CARD_UPDATE', // Update card details
  CARD_DELETE: 'CARD_DELETE', // Delete a card
  CARD_MOVE: 'CARD_MOVE', // Move card between/within columns

  // ==================== UI ACTIONS ====================
  MODAL_OPEN: 'MODAL_OPEN', // Open card detail modal
  MODAL_CLOSE: 'MODAL_CLOSE', // Close card detail modal
  DIALOG_SHOW: 'DIALOG_SHOW', // Show confirmation dialog
  DIALOG_HIDE: 'DIALOG_HIDE', // Hide confirmation dialog

  // ==================== SYNC ACTIONS ====================
  SYNC_SET_STATUS: 'SYNC_SET_STATUS', // Update sync status
  SYNC_ERROR: 'SYNC_ERROR', // Set sync error
  SYNC_REVERT: 'SYNC_REVERT', // Revert an optimistic update
}

/**
 * Action Creators
 *
 * Factory functions that create properly-typed action objects.
 * Using action creators ensures consistency and enables validation.
 *
 * BENEFITS:
 * - Type safety (payload structure is enforced)
 * - Encapsulation (components don't need to know action structure)
 * - Testability (easy to unit test action creators)
 * - Documentation (JSDoc describes each action's purpose)
 */

// ==================== BOARD ACTION CREATORS ====================

/**
 * Load board data from storage
 * @param {Object} data - The board data to load
 */
export const loadBoard = (data) => ({
  type: ActionTypes.BOARD_LOAD,
  payload: { data },
})

/**
 * Reset board to initial state
 */
export const resetBoard = () => ({
  type: ActionTypes.BOARD_RESET,
})

// ==================== COLUMN ACTION CREATORS ====================

/**
 * Add a new column
 * @param {string} id - UUID for the new column
 * @param {string} title - Column title
 */
export const addColumn = (id, title) => ({
  type: ActionTypes.COLUMN_ADD,
  payload: { id, title },
})

/**
 * Rename a column
 * @param {string} columnId - Column to rename
 * @param {string} title - New title
 */
export const renameColumn = (columnId, title) => ({
  type: ActionTypes.COLUMN_RENAME,
  payload: { columnId, title },
})

/**
 * Archive (delete) a column and its cards
 * @param {string} columnId - Column to archive
 */
export const archiveColumn = (columnId) => ({
  type: ActionTypes.COLUMN_ARCHIVE,
  payload: { columnId },
})

// ==================== CARD ACTION CREATORS ====================

/**
 * Add a new card to a column
 * @param {string} id - UUID for the new card
 * @param {string} columnId - Column to add card to
 * @param {string} title - Card title
 * @param {string} description - Card description (optional)
 * @param {Array} tags - Card tags (optional)
 */
export const addCard = (id, columnId, title, description = '', tags = []) => ({
  type: ActionTypes.CARD_ADD,
  payload: {
    id,
    columnId,
    card: {
      id,
      title,
      description,
      tags,
      createdAt: new Date().toISOString(),
    },
  },
})

/**
 * Update card details
 * @param {string} cardId - Card to update
 * @param {Object} updates - Fields to update { title?, description?, tags? }
 */
export const updateCard = (cardId, updates) => ({
  type: ActionTypes.CARD_UPDATE,
  payload: { cardId, updates },
})

/**
 * Delete a card
 * @param {string} cardId - Card to delete
 * @param {string} columnId - Column containing the card
 */
export const deleteCard = (cardId, columnId) => ({
  type: ActionTypes.CARD_DELETE,
  payload: { cardId, columnId },
})

/**
 * Move a card within or between columns
 * @param {string} cardId - Card to move
 * @param {string} sourceColumnId - Source column
 * @param {string} destColumnId - Destination column
 * @param {number} destIndex - Index in destination column
 */
export const moveCard = (cardId, sourceColumnId, destColumnId, destIndex) => ({
  type: ActionTypes.CARD_MOVE,
  payload: { cardId, sourceColumnId, destColumnId, destIndex },
})

// ==================== UI ACTION CREATORS ====================

/**
 * Open card detail modal
 * @param {Object} card - Card to edit
 * @param {string} columnId - Column containing the card
 */
export const openModal = (card, columnId) => ({
  type: ActionTypes.MODAL_OPEN,
  payload: { card: { ...card, columnId } },
})

/**
 * Close card detail modal
 */
export const closeModal = () => ({
  type: ActionTypes.MODAL_CLOSE,
})

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} onConfirm - Callback when confirmed
 */
export const showDialog = (title, message, onConfirm) => ({
  type: ActionTypes.DIALOG_SHOW,
  payload: { title, message, onConfirm },
})

/**
 * Hide confirmation dialog
 */
export const hideDialog = () => ({
  type: ActionTypes.DIALOG_HIDE,
})

// ==================== SYNC ACTION CREATORS ====================

/**
 * Set board version (from server sync)
 * @param {number} version - New version number
 */
export const setVersion = (version) => ({
  type: ActionTypes.BOARD_SET_VERSION,
  payload: { version },
})

/**
 * Revert an optimistic update
 * @param {Object} previousState - State before the optimistic update
 */
export const syncRevert = (previousState) => ({
  type: ActionTypes.SYNC_REVERT,
  payload: { previousState },
})
