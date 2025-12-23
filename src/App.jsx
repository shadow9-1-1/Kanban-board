import './App.css'
import { Header, Toolbar, Board, CardDetailModal, ConfirmDialog } from './components'
import { BoardProvider, useBoardState, useBoardActions } from './context'


function AppContent() {

  const { board: boardData, ui } = useBoardState()

  // Get action handlers from context
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
  } = useBoardActions()

  
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

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Fixed Header */}
      <Header />

      {/* Toolbar for board actions */}
      <Toolbar onAddColumn={handleAddColumn} />

      {/* Main Board Area - scrollable */}
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

      {/* Card Detail Modal - rendered when a card is selected */}
      {ui.selectedCard && (
        <CardDetailModal
          card={ui.selectedCard}
          onClose={handleCloseModal}
          onSave={handleUpdateCard}
          onDelete={onDeleteCard}
        />
      )}

      {/* Confirmation Dialog - rendered when confirmation is needed */}
      <ConfirmDialog
        isOpen={ui.confirmDialog.isOpen}
        title={ui.confirmDialog.title}
        message={ui.confirmDialog.message}
        onConfirm={ui.confirmDialog.onConfirm}
        onCancel={handleHideDialog}
      />
    </div>
  )
}


function App() {
  return (
    <BoardProvider>
      <AppContent />
    </BoardProvider>
  )
}

export default App
