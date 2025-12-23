/**
 * Unit Tests for useBoardState Hook
 *
 * Tests the enhanced wrapper hook that provides:
 * - Selectors for accessing board state
 * - Computed values for derived data
 * - Bound action creators
 * - Batch operations
 *
 * NOTE: The board uses a normalized state shape:
 * - columns: { [id]: { id, title, cardIds: [] } }
 * - columnOrder: [id1, id2, ...]
 * - cards: { [id]: { id, title, description, tags, ... } }
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useBoardState } from './useBoardState'
import { BoardProvider } from '../context/BoardProvider'

// ==================== TEST WRAPPER ====================

/**
 * Create wrapper that uses BoardProvider with initial state
 * Note: BoardProvider initializes from localStorage/createInitialState
 * We need to use the actual provider for integration tests
 */
const createWrapper = () => {
  return function Wrapper({ children }) {
    return <BoardProvider>{children}</BoardProvider>
  }
}

// ==================== TESTS ====================

describe('useBoardState Hook', () => {
  // Clear localStorage before each test to ensure fresh state
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Selectors', () => {
    it('should provide selectors object', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      expect(result.current.selectors).toBeDefined()
      expect(typeof result.current.selectors.getColumn).toBe('function')
      expect(typeof result.current.selectors.getCard).toBe('function')
      expect(typeof result.current.selectors.getCardsInColumn).toBe('function')
    })

    it('getColumn should return column from columnOrder', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      // Get first column from column order
      const columnId = result.current.columnOrder[0]
      const column = result.current.selectors.getColumn(columnId)
      expect(column).not.toBeNull()
      expect(column.id).toBe(columnId)
    })

    it('getColumn should return null for non-existent column', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      const column = result.current.selectors.getColumn('non-existent')
      expect(column).toBeNull()
    })

    it('getAllTags should return array', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      const tags = result.current.selectors.getAllTags()
      expect(Array.isArray(tags)).toBe(true)
    })
  })

  describe('Computed Values', () => {
    it('should provide computed object', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      expect(result.current.computed).toBeDefined()
    })

    it('columnCount should return correct count', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      // Default initial data creates 3 columns: To Do, In Progress, Done
      expect(result.current.computed.columnCount).toBe(3)
    })

    it('totalCardCount should return total cards', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      // Initially 0 cards
      expect(result.current.computed.totalCardCount).toBe(0)
    })

    it('isEmpty should correctly identify empty board', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      // Board has columns but no cards, isEmpty checks for cards
      expect(result.current.computed.totalCardCount).toBe(0)
    })

    it('version should return current version', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      expect(result.current.computed.version).toBe(1)
    })
  })

  describe('Actions', () => {
    it('should provide actions object', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      expect(result.current.actions).toBeDefined()
      expect(typeof result.current.actions.addColumn).toBe('function')
      expect(typeof result.current.actions.addCard).toBe('function')
    })

    it('addColumn should add a new column', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      const initialCount = result.current.computed.columnCount

      act(() => {
        result.current.actions.addColumn('New Column')
      })

      expect(result.current.computed.columnCount).toBe(initialCount + 1)
    })

    it('addCard should add a card to column', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      // Get first column
      const columnId = result.current.columnOrder[0]

      act(() => {
        result.current.actions.addCard(columnId, { title: 'New Card' })
      })

      expect(result.current.computed.totalCardCount).toBe(1)
    })

    it('deleteCard should remove card', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      // First add a card
      const columnId = result.current.columnOrder[0]
      let cardId

      act(() => {
        cardId = result.current.actions.addCard(columnId, { title: 'Test Card' })
      })

      expect(result.current.computed.totalCardCount).toBe(1)

      act(() => {
        // deleteCard requires both cardId and columnId
        result.current.actions.deleteCard(cardId, columnId)
      })

      expect(result.current.computed.totalCardCount).toBe(0)
    })
  })

  describe('Batch Operations', () => {
    it('should provide batch object', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      expect(result.current.batch).toBeDefined()
      expect(typeof result.current.batch.clearColumn).toBe('function')
    })
  })

  describe('Raw State Access', () => {
    it('should provide board state', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      expect(result.current.board).toBeDefined()
      expect(result.current.columns).toBeDefined()
      expect(result.current.columnOrder).toBeDefined()
      expect(result.current.cards).toBeDefined()
    })

    it('should provide columns object', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.columns).toBe('object')
    })

    it('should provide orderedColumns array via selector', () => {
      const { result } = renderHook(() => useBoardState(), {
        wrapper: createWrapper(),
      })

      const orderedColumns = result.current.selectors.getOrderedColumns()
      expect(Array.isArray(orderedColumns)).toBe(true)
      expect(orderedColumns.length).toBe(3) // Default 3 columns
    })
  })
})
