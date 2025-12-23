// Context objects (rarely needed directly)
export { BoardStateContext, BoardDispatchContext } from './BoardContext'

// Provider component
export { BoardProvider } from './BoardProvider'

// Reducer and state factory
export { boardReducer, createInitialState } from './boardReducer'

// Action types and creators
export { ActionTypes } from './boardActions'
export {
  loadBoard,
  resetBoard,
  addColumn,
  renameColumn,
  archiveColumn,
  addCard,
  updateCard,
  deleteCard,
  moveCard,
  openModal,
  closeModal,
  showDialog,
  hideDialog,
} from './boardActions'

// Custom hooks (recommended API)
export {
  useBoardState,
  useBoardDispatch,
  useBoard,
  useBoardActions,
} from './useBoardContext'
