import { useCallback, lazy, Suspense } from 'react'
import PropTypes from 'prop-types'
import './App.css'
import { Header, Toolbar, Board, SyncStatus } from './components'
import {
  ModalFallback,
  CardDetailModalFallback,
  ConflictResolutionModalFallback,
  ConfirmDialogFallback,
} from './components/LoadingFallback'
import { BoardProvider, SyncProvider, useBoardState, useBoardActions } from './context'
import { ActionTypes } from './context/boardActions'

// Lazy loaded components for code splitting
const CardDetailModal = lazy(() => import('./components/CardDetailModal'))
const ConfirmDialog = lazy(() => import('./components/ConfirmDialog'))
const ConflictResolutionModal = lazy(() => import('./components/ConflictResolutionModal'))

// Main app content with board and modals
function AppContent() {
  const { board: boardData, ui } = useBoardState()

  const {
    handleAddColumn,
    handleRenameColumn,
    handleArchiveColumn,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleMoveCard,
    handleOpenModal,
    handleCloseModal,
    handleShowDialog,
    handleHideDialog,
    handleResetBoard,
    dispatch,
  } = useBoardActions()

  const handleResolveConflict = (conflictId, resolution) => {
    dispatch({ type: ActionTypes.CONFLICT_RESOLVE, payload: { conflictId, resolution } })
  }

  const handleApplyMerge = (mergedState) => {
    dispatch({ type: ActionTypes.CONFLICT_APPLY_MERGE, payload: { mergedState } })
  }

  const handleDismissConflict = () => {
    dispatch({ type: ActionTypes.CONFLICT_DISMISS })
  }

  const onArchiveColumn = (columnId) => {
    const column = boardData.columns[columnId]
    const cardCount = column.cardIds.length
    handleShowDialog(
      'Archive List?',
      `This will permanently delete "${column.title}" and ${cardCount} card${cardCount !== 1 ? 's' : ''}. This action cannot be undone.`,
      () => handleArchiveColumn(columnId)
    )
  }

  const onDeleteCard = (cardId, columnId) => {
    const card = boardData.cards[cardId]
    handleShowDialog('Delete Card?', `This will permanently delete "${card.title}".`, () =>
      handleDeleteCard(cardId, columnId)
    )
  }

  const onCardClick = (card, columnId) => {
    handleOpenModal({ ...card, columnId })
  }

  const onResetBoard = () => {
    handleShowDialog(
      'Reset Board?',
      'This will reset the board to its initial state. All columns and cards will be replaced with default data. This action cannot be undone.',
      handleResetBoard
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header>
        <div className="flex items-center gap-3">
          <SyncStatus />
          <button
            onClick={onResetBoard}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/30"
            data-testid="reset-board-button"
          >
            Reset Board
          </button>
        </div>
      </Header>
      <Toolbar onAddColumn={handleAddColumn} />
      <main className="flex-1 overflow-hidden">
        <Board
          boardData={boardData}
          onMoveCard={handleMoveCard}
          onRenameColumn={handleRenameColumn}
          onArchiveColumn={onArchiveColumn}
          onAddCard={handleAddCard}
          onCardClick={onCardClick}
          onDeleteCard={onDeleteCard}
        />
      </main>

      {ui.selectedCard && (
        <Suspense fallback={<CardDetailModalFallback />}>
          <CardDetailModal
            card={ui.selectedCard}
            onClose={handleCloseModal}
            onSave={handleUpdateCard}
            onDelete={onDeleteCard}
          />
        </Suspense>
      )}

      <Suspense fallback={<ConfirmDialogFallback />}>
        <ConfirmDialog
          isOpen={ui.confirmDialog.isOpen}
          title={ui.confirmDialog.title}
          message={ui.confirmDialog.message}
          onConfirm={ui.confirmDialog.onConfirm}
          onCancel={handleHideDialog}
        />
      </Suspense>

      <Suspense fallback={<ConflictResolutionModalFallback />}>
        <ConflictResolutionModal
          isOpen={ui.conflictDialog?.isOpen || false}
          conflicts={ui.conflictDialog?.conflicts || []}
          localState={ui.conflictDialog?.localState}
          serverState={ui.conflictDialog?.serverState}
          baseState={ui.conflictDialog?.baseState}
          resolutions={ui.conflictDialog?.resolutions || {}}
          onResolve={handleResolveConflict}
          onApplyMerge={handleApplyMerge}
          onDismiss={handleDismissConflict}
        />
      </Suspense>
    </div>
  )
}

function App() {
  return (
    <BoardProvider>
      <SyncProviderWrapper>
        <AppContent />
      </SyncProviderWrapper>
    </BoardProvider>
  )
}

// Connects SyncProvider to BoardProvider state
function SyncProviderWrapper({ children }) {
  const state = useBoardState()
  const dispatch = useBoardActions().dispatch

  const handleConflict = useCallback(
    ({ conflicts, localState, serverState, baseState }) => {
      dispatch({
        type: ActionTypes.CONFLICT_DETECTED,
        payload: { conflicts, localState, serverState, baseState },
      })
    },
    [dispatch]
  )

  const getCurrentState = useCallback(() => state, [state])

  return (
    <SyncProvider onConflict={handleConflict} getCurrentState={getCurrentState}>
      {children}
    </SyncProvider>
  )
}

SyncProviderWrapper.propTypes = {
  children: PropTypes.node.isRequired,
}

export default App
