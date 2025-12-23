// Mock Server Handlers - Simulates REST API for Kanban board
import { http, HttpResponse, delay } from 'msw'
import { createInitialData } from '../utils'

let serverState = { board: createInitialData(), version: 1, lastModifiedAt: new Date().toISOString() }

// Reset server state (for testing)
export const resetServerState = () => { serverState = { board: createInitialData(), version: 1, lastModifiedAt: new Date().toISOString() } }

// Get current server state (for testing)
export const getServerState = () => ({ ...serverState })

// Increment version and update timestamp
const bumpVersion = () => { serverState.version++; serverState.lastModifiedAt = new Date().toISOString() }

const SIMULATED_LATENCY_MIN = 50
const SIMULATED_LATENCY_MAX = 200
const FAILURE_RATE = 0.05

// Simulate network latency
const simulateLatency = async () => {
  const ms = Math.floor(Math.random() * (SIMULATED_LATENCY_MAX - SIMULATED_LATENCY_MIN)) + SIMULATED_LATENCY_MIN
  await delay(ms)
}

// Simulate random server failure (5% chance)
const shouldSimulateFailure = () => Math.random() < FAILURE_RATE

// Check version for conflicts
const hasConflict = (clientVersion) => clientVersion < serverState.version

// Apply a generic action to server state
function applyAction(action) {
  const { type, payload } = action
  switch (type) {
    case 'COLUMN_ADD': {
      const { id, title } = payload
      serverState.board.columns[id] = { id, title, cardIds: [] }
      serverState.board.columnOrder.push(id)
      break
    }
    case 'COLUMN_RENAME': {
      const { columnId, title } = payload
      if (serverState.board.columns[columnId]) serverState.board.columns[columnId].title = title
      break
    }
    case 'COLUMN_ARCHIVE': {
      const { columnId } = payload
      const column = serverState.board.columns[columnId]
      if (column) {
        column.cardIds.forEach((cardId) => { delete serverState.board.cards[cardId] })
        delete serverState.board.columns[columnId]
        serverState.board.columnOrder = serverState.board.columnOrder.filter((id) => id !== columnId)
      }
      break
    }
    case 'CARD_ADD': {
      const { columnId, card } = payload
      serverState.board.cards[card.id] = card
      if (serverState.board.columns[columnId]) serverState.board.columns[columnId].cardIds.push(card.id)
      break
    }
    case 'CARD_UPDATE': {
      const { cardId, updates } = payload
      if (serverState.board.cards[cardId]) {
        serverState.board.cards[cardId] = { ...serverState.board.cards[cardId], ...updates, updatedAt: new Date().toISOString() }
      }
      break
    }
    case 'CARD_DELETE': {
      const { cardId, columnId } = payload
      delete serverState.board.cards[cardId]
      if (serverState.board.columns[columnId]) {
        serverState.board.columns[columnId].cardIds = serverState.board.columns[columnId].cardIds.filter((id) => id !== cardId)
      }
      break
    }
    case 'CARD_MOVE': {
      const { cardId, sourceColumnId, destColumnId, destIndex } = payload
      serverState.board.columns[sourceColumnId].cardIds = serverState.board.columns[sourceColumnId].cardIds.filter((id) => id !== cardId)
      serverState.board.columns[destColumnId].cardIds.splice(destIndex, 0, cardId)
      break
    }
    default: throw new Error(`Unknown action type: ${type}`)
  }
}

export const handlers = [
  // GET /api/board - Fetch entire board
  http.get('/api/board', async () => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    return HttpResponse.json({ board: serverState.board, version: serverState.version, lastModifiedAt: serverState.lastModifiedAt })
  }),

  // PUT /api/board - Replace entire board
  http.put('/api/board', async ({ request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { board, version } = await request.json()
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict - server has newer data', serverVersion: serverState.version, lastModifiedAt: serverState.lastModifiedAt }, { status: 409 })
    serverState.board = board
    bumpVersion()
    return HttpResponse.json({ board: serverState.board, version: serverState.version, lastModifiedAt: serverState.lastModifiedAt })
  }),

  // POST /api/board/merge - Submit resolved merge
  http.post('/api/board/merge', async ({ request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { mergedBoard, serverVersion } = await request.json()
    if (serverVersion !== serverState.version) {
      return HttpResponse.json({ message: 'Server state changed during merge - please retry', conflict: true, serverState: { board: serverState.board, version: serverState.version, lastModifiedAt: serverState.lastModifiedAt } }, { status: 409 })
    }
    serverState.board = mergedBoard
    bumpVersion()
    return HttpResponse.json({ success: true, board: serverState.board, version: serverState.version, lastModifiedAt: serverState.lastModifiedAt })
  }),

  // POST /api/board/sync - Sync single action
  http.post('/api/board/sync', async ({ request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { action, version } = await request.json()
    if (hasConflict(version)) {
      return HttpResponse.json({ message: 'Version conflict', conflict: true, serverVersion: serverState.version, serverState: { board: serverState.board, version: serverState.version, lastModifiedAt: serverState.lastModifiedAt } }, { status: 409 })
    }
    try { applyAction(action); bumpVersion(); return HttpResponse.json({ success: true, version: serverState.version, lastModifiedAt: serverState.lastModifiedAt }) }
    catch (error) { return HttpResponse.json({ message: error.message }, { status: 400 }) }
  }),

  // POST /api/columns - Add column
  http.post('/api/columns', async ({ request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { id, title, version } = await request.json()
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict', serverVersion: serverState.version }, { status: 409 })
    serverState.board.columns[id] = { id, title, cardIds: [] }
    serverState.board.columnOrder.push(id)
    bumpVersion()
    return HttpResponse.json({ column: serverState.board.columns[id], version: serverState.version })
  }),

  // PATCH /api/columns/:id - Rename column
  http.patch('/api/columns/:id', async ({ params, request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { id } = params
    const { title, version } = await request.json()
    if (!serverState.board.columns[id]) return HttpResponse.json({ message: 'Column not found' }, { status: 404 })
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict' }, { status: 409 })
    serverState.board.columns[id].title = title
    bumpVersion()
    return HttpResponse.json({ column: serverState.board.columns[id], version: serverState.version })
  }),

  // DELETE /api/columns/:id - Archive column
  http.delete('/api/columns/:id', async ({ params, request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { id } = params
    const { version } = await request.json()
    if (!serverState.board.columns[id]) return HttpResponse.json({ message: 'Column not found' }, { status: 404 })
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict' }, { status: 409 })
    const column = serverState.board.columns[id]
    column.cardIds.forEach((cardId) => { delete serverState.board.cards[cardId] })
    delete serverState.board.columns[id]
    serverState.board.columnOrder = serverState.board.columnOrder.filter((cid) => cid !== id)
    bumpVersion()
    return HttpResponse.json({ success: true, version: serverState.version })
  }),

  // POST /api/columns/:id/cards - Add card to column
  http.post('/api/columns/:id/cards', async ({ params, request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { id: columnId } = params
    const { card, version } = await request.json()
    if (!serverState.board.columns[columnId]) return HttpResponse.json({ message: 'Column not found' }, { status: 404 })
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict' }, { status: 409 })
    serverState.board.cards[card.id] = card
    serverState.board.columns[columnId].cardIds.push(card.id)
    bumpVersion()
    return HttpResponse.json({ card: serverState.board.cards[card.id], version: serverState.version })
  }),

  // PATCH /api/cards/:id - Update card
  http.patch('/api/cards/:id', async ({ params, request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { id } = params
    const { updates, version } = await request.json()
    if (!serverState.board.cards[id]) return HttpResponse.json({ message: 'Card not found' }, { status: 404 })
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict' }, { status: 409 })
    serverState.board.cards[id] = { ...serverState.board.cards[id], ...updates, updatedAt: new Date().toISOString() }
    bumpVersion()
    return HttpResponse.json({ card: serverState.board.cards[id], version: serverState.version })
  }),

  // DELETE /api/cards/:id - Delete card
  http.delete('/api/cards/:id', async ({ params, request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { id } = params
    const { columnId, version } = await request.json()
    if (!serverState.board.cards[id]) return HttpResponse.json({ message: 'Card not found' }, { status: 404 })
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict' }, { status: 409 })
    if (serverState.board.columns[columnId]) {
      serverState.board.columns[columnId].cardIds = serverState.board.columns[columnId].cardIds.filter((cid) => cid !== id)
    }
    delete serverState.board.cards[id]
    bumpVersion()
    return HttpResponse.json({ success: true, version: serverState.version })
  }),

  // POST /api/cards/:id/move - Move card
  http.post('/api/cards/:id/move', async ({ params, request }) => {
    await simulateLatency()
    if (shouldSimulateFailure()) return HttpResponse.json({ message: 'Server error' }, { status: 500 })
    const { id } = params
    const { sourceColumnId, destColumnId, destIndex, version } = await request.json()
    if (!serverState.board.cards[id]) return HttpResponse.json({ message: 'Card not found' }, { status: 404 })
    if (hasConflict(version)) return HttpResponse.json({ message: 'Version conflict' }, { status: 409 })
    serverState.board.columns[sourceColumnId].cardIds = serverState.board.columns[sourceColumnId].cardIds.filter((cid) => cid !== id)
    serverState.board.columns[destColumnId].cardIds.splice(destIndex, 0, id)
    bumpVersion()
    return HttpResponse.json({ success: true, version: serverState.version })
  }),
]
