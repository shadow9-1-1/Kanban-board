// Conflict Resolution Service - Three-way merge for Kanban board data
import { generateId } from '../utils'

// Merge strategies
export const MergeStrategy = {
  AUTO_MERGE: 'auto_merge',
  LOCAL_WINS: 'local_wins',
  SERVER_WINS: 'server_wins',
  MANUAL: 'manual',
}

// Conflict types
export const ConflictType = {
  SAME_FIELD: 'same_field',
  DELETE_MODIFY: 'delete_modify',
  MOVE_CONFLICT: 'move_conflict',
  ORDER_CONFLICT: 'order_conflict',
  CREATE_CONFLICT: 'create_conflict',
}

// Resolution choices
export const ResolutionChoice = {
  KEEP_LOCAL: 'keep_local',
  KEEP_SERVER: 'keep_server',
  KEEP_BOTH: 'keep_both',
  CUSTOM: 'custom',
}

// Deep compare two values
export const deepEqual = (a, b) => {
  if (a === b) return true
  if (a === null || a === undefined || b === null || b === undefined) return false
  if (typeof a !== typeof b) return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every((key) => deepEqual(a[key], b[key]))
  }

  return false
}

// Get differences between two objects
export const getDiff = (base, changed) => {
  const diff = {}

  for (const key of Object.keys(changed)) {
    if (!deepEqual(base[key], changed[key])) {
      diff[key] = {
        from: base[key],
        to: changed[key],
        type: base[key] === undefined ? 'added' : 'changed',
      }
    }
  }

  for (const key of Object.keys(base)) {
    if (!(key in changed)) {
      diff[key] = { from: base[key], to: undefined, type: 'removed' }
    }
  }

  return diff
}

// Detect conflicts between local and server changes
export const detectConflicts = (base, local, server) => {
  const conflicts = []

  const localDiff = getDiff(base.board, local.board)
  const serverDiff = getDiff(base.board, server.board)

  const columnConflicts = detectColumnConflicts(base.board.columns, local.board.columns, server.board.columns, localDiff, serverDiff)
  conflicts.push(...columnConflicts)

  const cardConflicts = detectCardConflicts(base.board.cards, local.board.cards, server.board.cards)
  conflicts.push(...cardConflicts)

  const orderConflicts = detectOrderConflicts(base.board.columnOrder, local.board.columnOrder, server.board.columnOrder)
  conflicts.push(...orderConflicts)

  return conflicts
}

// Detect column-level conflicts
const detectColumnConflicts = (baseColumns, localColumns, serverColumns) => {
  const conflicts = []
  const allColumnIds = new Set([
    ...Object.keys(baseColumns || {}),
    ...Object.keys(localColumns || {}),
    ...Object.keys(serverColumns || {}),
  ])

  for (const columnId of allColumnIds) {
    const base = baseColumns?.[columnId]
    const local = localColumns?.[columnId]
    const server = serverColumns?.[columnId]

    if (!local && server && base) {
      const serverChanged = !deepEqual(base, server)
      if (serverChanged) {
        conflicts.push({
          id: generateId(),
          type: ConflictType.DELETE_MODIFY,
          entity: 'column',
          entityId: columnId,
          description: `Column "${base.title}" was deleted locally but modified on server`,
          localValue: null,
          serverValue: server,
          baseValue: base,
        })
      }
    } else if (local && !server && base) {
      const localChanged = !deepEqual(base, local)
      if (localChanged) {
        conflicts.push({
          id: generateId(),
          type: ConflictType.DELETE_MODIFY,
          entity: 'column',
          entityId: columnId,
          description: `Column "${base.title}" was modified locally but deleted on server`,
          localValue: local,
          serverValue: null,
          baseValue: base,
        })
      }
    } else if (local && server && base) {
      const localChanged = !deepEqual(base, local)
      const serverChanged = !deepEqual(base, server)

      if (localChanged && serverChanged && !deepEqual(local, server)) {
        if (local.title !== server.title && base.title !== local.title && base.title !== server.title) {
          conflicts.push({
            id: generateId(),
            type: ConflictType.SAME_FIELD,
            entity: 'column',
            entityId: columnId,
            field: 'title',
            description: `Column title conflict: "${local.title}" vs "${server.title}"`,
            localValue: local.title,
            serverValue: server.title,
            baseValue: base.title,
          })
        }

        if (!deepEqual(local.cardIds, server.cardIds) && !deepEqual(base.cardIds, local.cardIds) && !deepEqual(base.cardIds, server.cardIds)) {
          conflicts.push({
            id: generateId(),
            type: ConflictType.ORDER_CONFLICT,
            entity: 'column',
            entityId: columnId,
            field: 'cardIds',
            description: `Card order conflict in column "${local.title || server.title}"`,
            localValue: local.cardIds,
            serverValue: server.cardIds,
            baseValue: base.cardIds,
          })
        }
      }
    }
  }

  return conflicts
}

// Detect card-level conflicts
const detectCardConflicts = (baseCards, localCards, serverCards) => {
  const conflicts = []
  const allCardIds = new Set([
    ...Object.keys(baseCards || {}),
    ...Object.keys(localCards || {}),
    ...Object.keys(serverCards || {}),
  ])

  for (const cardId of allCardIds) {
    const base = baseCards?.[cardId]
    const local = localCards?.[cardId]
    const server = serverCards?.[cardId]

    if (!local && server && base) {
      const serverChanged = !deepEqual(base, server)
      if (serverChanged) {
        conflicts.push({
          id: generateId(),
          type: ConflictType.DELETE_MODIFY,
          entity: 'card',
          entityId: cardId,
          description: `Card "${base.title}" was deleted locally but modified on server`,
          localValue: null,
          serverValue: server,
          baseValue: base,
        })
      }
    } else if (local && !server && base) {
      const localChanged = !deepEqual(base, local)
      if (localChanged) {
        conflicts.push({
          id: generateId(),
          type: ConflictType.DELETE_MODIFY,
          entity: 'card',
          entityId: cardId,
          description: `Card "${base.title}" was modified locally but deleted on server`,
          localValue: local,
          serverValue: null,
          baseValue: base,
        })
      }
    } else if (local && server && base) {
      const fieldsToCheck = ['title', 'description', 'tags']

      for (const field of fieldsToCheck) {
        const baseVal = base[field]
        const localVal = local[field]
        const serverVal = server[field]

        const localChanged = !deepEqual(baseVal, localVal)
        const serverChanged = !deepEqual(baseVal, serverVal)

        if (localChanged && serverChanged && !deepEqual(localVal, serverVal)) {
          conflicts.push({
            id: generateId(),
            type: ConflictType.SAME_FIELD,
            entity: 'card',
            entityId: cardId,
            field,
            description: `Card "${local.title || server.title}" has conflicting ${field}`,
            localValue: localVal,
            serverValue: serverVal,
            baseValue: baseVal,
          })
        }
      }
    }
  }

  return conflicts
}

// Detect column order conflicts
const detectOrderConflicts = (baseOrder, localOrder, serverOrder) => {
  const conflicts = []
  const localChanged = !deepEqual(baseOrder, localOrder)
  const serverChanged = !deepEqual(baseOrder, serverOrder)

  if (localChanged && serverChanged && !deepEqual(localOrder, serverOrder)) {
    conflicts.push({
      id: generateId(),
      type: ConflictType.ORDER_CONFLICT,
      entity: 'board',
      field: 'columnOrder',
      description: 'Column order was changed differently',
      localValue: localOrder,
      serverValue: serverOrder,
      baseValue: baseOrder,
    })
  }

  return conflicts
}

// Three-way merge with automatic conflict resolution
export const threeWayMerge = (base, local, server, strategy = MergeStrategy.AUTO_MERGE, resolutions = {}) => {
  const conflicts = detectConflicts(base, local, server)

  const merged = {
    board: {
      columns: { ...server.board.columns },
      columnOrder: [...server.board.columnOrder],
      cards: { ...server.board.cards },
    },
    version: server.version + 1,
    lastModifiedAt: new Date().toISOString(),
  }

  const resolved = []
  const unresolved = []

  applyNonConflictingChanges(merged, base, local, server)

  for (const conflict of conflicts) {
    const resolution = resolutions[conflict.id]

    if (resolution) {
      applyResolution(merged, conflict, resolution)
      resolved.push({ ...conflict, resolution })
    } else if (strategy === MergeStrategy.AUTO_MERGE) {
      const autoResolution = tryAutoResolve(conflict)
      if (autoResolution) {
        applyResolution(merged, conflict, autoResolution)
        resolved.push({ ...conflict, resolution: autoResolution })
      } else {
        unresolved.push(conflict)
      }
    } else if (strategy === MergeStrategy.LOCAL_WINS) {
      applyResolution(merged, conflict, { choice: ResolutionChoice.KEEP_LOCAL })
      resolved.push({ ...conflict, resolution: { choice: ResolutionChoice.KEEP_LOCAL } })
    } else if (strategy === MergeStrategy.SERVER_WINS) {
      applyResolution(merged, conflict, { choice: ResolutionChoice.KEEP_SERVER })
      resolved.push({ ...conflict, resolution: { choice: ResolutionChoice.KEEP_SERVER } })
    } else {
      unresolved.push(conflict)
    }
  }

  return { merged, conflicts: unresolved, resolved, hasConflicts: unresolved.length > 0 }
}

// Apply non-conflicting local changes to merged result
const applyNonConflictingChanges = (merged, base, local, server) => {
  for (const [columnId, localColumn] of Object.entries(local.board.columns || {})) {
    const baseColumn = base.board.columns?.[columnId]
    const serverColumn = server.board.columns?.[columnId]

    if (!serverColumn && !baseColumn) {
      merged.board.columns[columnId] = { ...localColumn }
      if (!merged.board.columnOrder.includes(columnId)) {
        merged.board.columnOrder.push(columnId)
      }
    } else if (serverColumn && baseColumn) {
      const localChanged = !deepEqual(baseColumn, localColumn)
      const serverChanged = !deepEqual(baseColumn, serverColumn)
      if (localChanged && !serverChanged) {
        merged.board.columns[columnId] = { ...localColumn }
      }
    }
  }

  for (const [cardId, localCard] of Object.entries(local.board.cards || {})) {
    const baseCard = base.board.cards?.[cardId]
    const serverCard = server.board.cards?.[cardId]

    if (!serverCard && !baseCard) {
      merged.board.cards[cardId] = { ...localCard }
      for (const [colId, col] of Object.entries(local.board.columns)) {
        if (col.cardIds?.includes(cardId) && merged.board.columns[colId]) {
          if (!merged.board.columns[colId].cardIds.includes(cardId)) {
            merged.board.columns[colId].cardIds.push(cardId)
          }
        }
      }
    } else if (serverCard && baseCard) {
      const localChanged = !deepEqual(baseCard, localCard)
      const serverChanged = !deepEqual(baseCard, serverCard)
      if (localChanged && !serverChanged) {
        merged.board.cards[cardId] = { ...localCard }
      }
    }
  }

  for (const cardId of Object.keys(base.board.cards || {})) {
    const localCard = local.board.cards?.[cardId]
    const serverCard = server.board.cards?.[cardId]
    const baseCard = base.board.cards[cardId]

    if (!localCard && serverCard && deepEqual(baseCard, serverCard)) {
      delete merged.board.cards[cardId]
      for (const col of Object.values(merged.board.columns)) {
        col.cardIds = col.cardIds?.filter((id) => id !== cardId) || []
      }
    }
  }
}

// Try to automatically resolve a conflict
const tryAutoResolve = (conflict) => {
  if (conflict.type === ConflictType.DELETE_MODIFY) return null

  if (conflict.type === ConflictType.SAME_FIELD && conflict.field === 'tags') {
    const merged = [...new Set([...(conflict.localValue || []), ...(conflict.serverValue || [])])]
    return { choice: ResolutionChoice.CUSTOM, value: merged }
  }

  if (conflict.type === ConflictType.ORDER_CONFLICT && conflict.field === 'cardIds') {
    const allCards = [...new Set([...(conflict.localValue || []), ...(conflict.serverValue || [])])]
    const ordered = (conflict.localValue || []).filter((id) => allCards.includes(id))
    const serverOnly = (conflict.serverValue || []).filter((id) => !ordered.includes(id) && allCards.includes(id))
    return { choice: ResolutionChoice.CUSTOM, value: [...ordered, ...serverOnly] }
  }

  return null
}

// Apply a resolution to the merged state
const applyResolution = (merged, conflict, resolution) => {
  const { choice, value } = resolution
  const valueToApply =
    choice === ResolutionChoice.KEEP_LOCAL ? conflict.localValue :
    choice === ResolutionChoice.KEEP_SERVER ? conflict.serverValue :
    choice === ResolutionChoice.CUSTOM ? value : null

  if (valueToApply === null && choice !== ResolutionChoice.KEEP_LOCAL) {
    if (conflict.entity === 'card') {
      delete merged.board.cards[conflict.entityId]
      for (const col of Object.values(merged.board.columns)) {
        col.cardIds = col.cardIds?.filter((id) => id !== conflict.entityId) || []
      }
    } else if (conflict.entity === 'column') {
      delete merged.board.columns[conflict.entityId]
      merged.board.columnOrder = merged.board.columnOrder.filter((id) => id !== conflict.entityId)
    }
    return
  }

  if (conflict.entity === 'card' && conflict.field) {
    if (merged.board.cards[conflict.entityId]) {
      merged.board.cards[conflict.entityId][conflict.field] = valueToApply
    }
  } else if (conflict.entity === 'card' && !conflict.field) {
    if (valueToApply) merged.board.cards[conflict.entityId] = valueToApply
  } else if (conflict.entity === 'column' && conflict.field === 'title') {
    if (merged.board.columns[conflict.entityId]) {
      merged.board.columns[conflict.entityId].title = valueToApply
    }
  } else if (conflict.entity === 'column' && conflict.field === 'cardIds') {
    if (merged.board.columns[conflict.entityId]) {
      merged.board.columns[conflict.entityId].cardIds = valueToApply
    }
  } else if (conflict.entity === 'column' && !conflict.field) {
    if (valueToApply) {
      merged.board.columns[conflict.entityId] = valueToApply
      if (!merged.board.columnOrder.includes(conflict.entityId)) {
        merged.board.columnOrder.push(conflict.entityId)
      }
    }
  } else if (conflict.entity === 'board' && conflict.field === 'columnOrder') {
    merged.board.columnOrder = valueToApply
  }
}

// ConflictResolver class - Manages conflict resolution workflow
export class ConflictResolver {
  constructor() {
    this.baseState = null
    this.pendingConflicts = []
    this.resolutions = {}
  }

  setBaseState(state) {
    this.baseState = JSON.parse(JSON.stringify(state))
  }

  getBaseState() {
    return this.baseState
  }

  hasBaseState() {
    return this.baseState !== null
  }

  merge(local, server, strategy = MergeStrategy.AUTO_MERGE) {
    if (!this.baseState) {
      this.baseState = JSON.parse(JSON.stringify(server))
    }
    const result = threeWayMerge(this.baseState, local, server, strategy, this.resolutions)
    this.pendingConflicts = result.conflicts
    return result
  }

  addResolution(conflictId, resolution) {
    this.resolutions[conflictId] = resolution
  }

  getPendingConflicts() {
    return this.pendingConflicts
  }

  clearResolutions() {
    this.resolutions = {}
    this.pendingConflicts = []
  }

  updateBaseState(newBase) {
    this.baseState = JSON.parse(JSON.stringify(newBase))
    this.clearResolutions()
  }
}

export const conflictResolver = new ConflictResolver()
export default conflictResolver
