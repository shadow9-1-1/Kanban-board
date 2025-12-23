/**
 * App Component - Main Application Entry Point
 *
 * This is the root component that orchestrates the entire Kanban board.
 * It connects the useBoard hook with all child components.
 *
 * ARCHITECTURE OVERVIEW:
 * =====================
 *
 *                        ┌─────────────┐
 *                        │     App     │
 *                        │  (useBoard) │
 *                        └──────┬──────┘
 *                               │
 *          ┌────────────────────┼────────────────────┐
 *          │                    │                    │
 *    ┌─────▼─────┐        ┌─────▼─────┐       ┌──────▼──────┐
 *    │  Header   │        │  Toolbar  │       │   Board     │
 *    └───────────┘        └───────────┘       └──────┬──────┘
 *                                                    │
 *                               ┌────────────────────┼────────────────────┐
 *                               │                    │                    │
 *                         ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
 *                         │ListColumn │        │ListColumn │        │ListColumn │
 *                         └─────┬─────┘        └───────────┘        └───────────┘
 *                               │
 *                    ┌──────────┼──────────┐
 *                    │          │          │
 *              ┌─────▼─────┐ ┌──▼──┐ ┌─────▼─────┐
 *              │   Card    │ │Card │ │   Card    │
 *              └───────────┘ └─────┘ └───────────┘
 *
 *
 * DATA FLOW:
 * 1. useBoard hook manages all state (columns, cards, modals)
 * 2. App passes state and handlers to children via props
 * 3. Children call handlers (passed as props) to request state changes
 * 4. useBoard updates state, React re-renders affected components
 *
 * COMPONENT RESPONSIBILITIES:
 * - Header: Branding, navigation (static)
 * - Toolbar: Board-level actions (add column)
 * - Board: DnD context, renders columns
 * - ListColumn: Column operations, renders cards
 * - Card: Card display, drag source
 * - CardDetailModal: Edit card details
 * - ConfirmDialog: Destructive action confirmation
 */

import './App.css'
import { Header, Toolbar, Board, CardDetailModal, ConfirmDialog } from './components'
import { useBoard } from './hooks'

function App() {
  // Get all state and handlers from the custom hook
  const {
    boardData,
    selectedCard,
    confirmDialog,
    addColumn,
    renameColumn,
    archiveColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    openCardModal,
    closeCardModal,
    showConfirmDialog,
    closeConfirmDialog,
  } = useBoard()

  /**
   * Handle column archive with confirmation
   * Shows a confirm dialog before actually archiving
   */
  const handleArchiveColumn = (columnId) => {
    const column = boardData.columns[columnId]
    const cardCount = column.cardIds.length

    showConfirmDialog(
      'Archive List?',
      `This will permanently delete "${column.title}" and ${cardCount} card${cardCount !== 1 ? 's' : ''}. This action cannot be undone.`,
      () => archiveColumn(columnId)
    )
  }

  /**
   * Handle card delete with confirmation
   */
  const handleDeleteCard = (cardId, columnId) => {
    const card = boardData.cards[cardId]

    showConfirmDialog('Delete Card?', `This will permanently delete "${card.title}".`, () =>
      deleteCard(cardId, columnId)
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Fixed Header */}
      <Header />

      {/* Toolbar for board actions */}
      <Toolbar onAddColumn={addColumn} />

      {/* Main Board Area - scrollable */}
      <main className="flex-1 overflow-hidden">
        <Board
          boardData={boardData}
          onMoveCard={moveCard}
          onRenameColumn={renameColumn}
          onArchiveColumn={handleArchiveColumn}
          onAddCard={addCard}
          onCardClick={openCardModal}
          onDeleteCard={handleDeleteCard}
        />
      </main>

      {/* Card Detail Modal - rendered when a card is selected */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={closeCardModal}
          onSave={updateCard}
          onDelete={handleDeleteCard}
        />
      )}

      {/* Confirmation Dialog - rendered when confirmation is needed */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
    </div>
  )
}

export default App
