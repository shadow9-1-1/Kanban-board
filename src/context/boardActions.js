// Action types for board state mutations
export const ActionTypes = {
  BOARD_LOAD: 'BOARD_LOAD',
  BOARD_RESET: 'BOARD_RESET',
  BOARD_SET_VERSION: 'BOARD_SET_VERSION',
  COLUMN_ADD: 'COLUMN_ADD',
  COLUMN_RENAME: 'COLUMN_RENAME',
  COLUMN_ARCHIVE: 'COLUMN_ARCHIVE',
  COLUMN_REORDER: 'COLUMN_REORDER',
  CARD_ADD: 'CARD_ADD',
  CARD_UPDATE: 'CARD_UPDATE',
  CARD_DELETE: 'CARD_DELETE',
  CARD_MOVE: 'CARD_MOVE',
  MODAL_OPEN: 'MODAL_OPEN',
  MODAL_CLOSE: 'MODAL_CLOSE',
  DIALOG_SHOW: 'DIALOG_SHOW',
  DIALOG_HIDE: 'DIALOG_HIDE',
  SYNC_SET_STATUS: 'SYNC_SET_STATUS',
  SYNC_ERROR: 'SYNC_ERROR',
  SYNC_REVERT: 'SYNC_REVERT',
  CONFLICT_DETECTED: 'CONFLICT_DETECTED',
  CONFLICT_RESOLVE: 'CONFLICT_RESOLVE',
  CONFLICT_APPLY_MERGE: 'CONFLICT_APPLY_MERGE',
  CONFLICT_DISMISS: 'CONFLICT_DISMISS',
}

// Board action creators
export const loadBoard = (data) => ({ type: ActionTypes.BOARD_LOAD, payload: { data } })
export const resetBoard = () => ({ type: ActionTypes.BOARD_RESET })

// Column action creators
export const addColumn = (id, title) => ({ type: ActionTypes.COLUMN_ADD, payload: { id, title } })
export const renameColumn = (columnId, title) => ({ type: ActionTypes.COLUMN_RENAME, payload: { columnId, title } })
export const archiveColumn = (columnId) => ({ type: ActionTypes.COLUMN_ARCHIVE, payload: { columnId } })

// Card action creators
export const addCard = (id, columnId, title, description = '', tags = []) => ({
  type: ActionTypes.CARD_ADD,
  payload: {
    id,
    columnId,
    card: { id, title, description, tags, createdAt: new Date().toISOString() },
  },
})
export const updateCard = (cardId, updates) => ({ type: ActionTypes.CARD_UPDATE, payload: { cardId, updates } })
export const deleteCard = (cardId, columnId) => ({ type: ActionTypes.CARD_DELETE, payload: { cardId, columnId } })
export const moveCard = (cardId, sourceColumnId, destColumnId, destIndex) => ({
  type: ActionTypes.CARD_MOVE,
  payload: { cardId, sourceColumnId, destColumnId, destIndex },
})

// UI action creators
export const openModal = (card, columnId) => ({ type: ActionTypes.MODAL_OPEN, payload: { card: { ...card, columnId } } })
export const closeModal = () => ({ type: ActionTypes.MODAL_CLOSE })
export const showDialog = (title, message, onConfirm) => ({ type: ActionTypes.DIALOG_SHOW, payload: { title, message, onConfirm } })
export const hideDialog = () => ({ type: ActionTypes.DIALOG_HIDE })

// Sync action creators
export const setVersion = (version) => ({ type: ActionTypes.BOARD_SET_VERSION, payload: { version } })
export const syncRevert = (previousState) => ({ type: ActionTypes.SYNC_REVERT, payload: { previousState } })

// Conflict action creators
export const conflictDetected = (conflicts, localState, serverState, baseState) => ({
  type: ActionTypes.CONFLICT_DETECTED,
  payload: { conflicts, localState, serverState, baseState },
})
export const resolveConflict = (conflictId, resolution) => ({ type: ActionTypes.CONFLICT_RESOLVE, payload: { conflictId, resolution } })
export const applyMerge = (mergedState) => ({ type: ActionTypes.CONFLICT_APPLY_MERGE, payload: { mergedState } })
export const dismissConflict = () => ({ type: ActionTypes.CONFLICT_DISMISS })
