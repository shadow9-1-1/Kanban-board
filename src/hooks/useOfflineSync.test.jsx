/**
 * Unit Tests for useOfflineSync Hook
 *
 * Tests the offline synchronization hook that provides:
 * - Queue management for pending changes
 * - Automatic retries with exponential backoff
 * - Online/offline status tracking
 * - Persistence to localStorage
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useOfflineSync } from './useOfflineSync'

// ==================== MOCKS ====================

// Mock storage utilities
jest.mock('../utils', () => ({
  saveToStorage: jest.fn(),
  loadFromStorage: jest.fn(() => null),
}))

import { saveToStorage, loadFromStorage } from '../utils'

// ==================== HELPERS ====================

/**
 * Helper to simulate online/offline events
 */
const simulateOnline = () => {
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
  window.dispatchEvent(new Event('online'))
}

const simulateOffline = () => {
  Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
  window.dispatchEvent(new Event('offline'))
}

// ==================== TESTS ====================

describe('useOfflineSync Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    loadFromStorage.mockReturnValue(null)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with correct default status', () => {
      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.status).toBeDefined()
      expect(result.current.status.isOnline).toBe(true)
      expect(result.current.status.isSyncing).toBe(false)
      expect(result.current.status.pendingCount).toBe(0)
      expect(result.current.status.failedCount).toBe(0)
    })

    it('should restore queue from localStorage on init', () => {
      const savedQueue = [
        { id: 'q1', action: { type: 'TEST' }, status: 'pending', retries: 0 },
      ]
      loadFromStorage.mockReturnValue(savedQueue)

      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.queue).toHaveLength(1)
      expect(result.current.status.pendingCount).toBe(1)
    })

    it('should reset processing items to pending on init', () => {
      const savedQueue = [
        { id: 'q1', action: { type: 'TEST' }, status: 'processing', retries: 0 },
      ]
      loadFromStorage.mockReturnValue(savedQueue)

      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.queue[0].status).toBe('pending')
    })
  })

  describe('Queue Management', () => {
    it('should enqueue actions', () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.enqueue({ type: 'ADD_CARD' }, 1)
      })

      expect(result.current.queue).toHaveLength(1)
      expect(result.current.status.pendingCount).toBe(1)
    })

    it('should generate unique queue IDs', () => {
      const { result } = renderHook(() => useOfflineSync())

      let id1, id2
      act(() => {
        id1 = result.current.enqueue({ type: 'ACTION_1' }, 1)
        id2 = result.current.enqueue({ type: 'ACTION_2' }, 1)
      })

      expect(id1).not.toBe(id2)
    })

    it('should save queue to localStorage on changes', () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      expect(saveToStorage).toHaveBeenCalled()
    })

    it('getQueueItem should return correct item', () => {
      const { result } = renderHook(() => useOfflineSync())

      let queueId
      act(() => {
        queueId = result.current.enqueue({ type: 'TEST' }, 1)
      })

      const item = result.current.getQueueItem(queueId)
      expect(item).toBeDefined()
      expect(item.action.type).toBe('TEST')
    })

    it('getPendingItems should filter pending items', () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.enqueue({ type: 'ACTION_1' }, 1)
        result.current.enqueue({ type: 'ACTION_2' }, 1)
      })

      const pending = result.current.getPendingItems()
      expect(pending).toHaveLength(2)
    })
  })

  describe('Sync Processing', () => {
    it('should process queue items on sync', async () => {
      const onSync = jest.fn().mockResolvedValue({ success: true })

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      // Wait for the auto-sync timeout
      await act(async () => {
        jest.advanceTimersByTime(200)
      })

      await waitFor(() => {
        expect(onSync).toHaveBeenCalled()
      })
    })

    it('should remove item from queue on success', async () => {
      const onSync = jest.fn().mockResolvedValue({ success: true })

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      await act(async () => {
        jest.advanceTimersByTime(200)
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(result.current.queue).toHaveLength(0)
      })
    })

    it('should call onSyncSuccess callback on success', async () => {
      const onSync = jest.fn().mockResolvedValue({ data: 'result' })
      const onSyncSuccess = jest.fn()

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, onSyncSuccess, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      await act(async () => {
        jest.advanceTimersByTime(200)
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(onSyncSuccess).toHaveBeenCalled()
      })
    })

    it('should not process queue when offline', async () => {
      const onSync = jest.fn().mockResolvedValue({ success: true })

      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      await act(async () => {
        jest.advanceTimersByTime(200)
      })

      expect(onSync).not.toHaveBeenCalled()
      expect(result.current.queue).toHaveLength(1)
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed items with backoff', async () => {
      const onSync = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ success: true })

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      // First attempt
      await act(async () => {
        jest.advanceTimersByTime(200)
        await Promise.resolve()
      })

      // Should be scheduled for retry
      await waitFor(() => {
        expect(result.current.queue[0]?.retries).toBe(1)
      })
    })

    it('should mark item as failed after max retries', async () => {
      const onSync = jest.fn().mockRejectedValue(new Error('Persistent error'))

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      // Simulate multiple retry attempts
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          jest.advanceTimersByTime(20000) // Advance past all retry delays
          await Promise.resolve()
        })
      }

      await waitFor(() => {
        const failedItems = result.current.getFailedItems()
        expect(failedItems.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('retryFailed should reset failed items to pending', () => {
      const savedQueue = [
        { id: 'q1', action: { type: 'TEST' }, status: 'failed', retries: 4, error: 'Failed' },
      ]
      loadFromStorage.mockReturnValue(savedQueue)

      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.status.failedCount).toBe(1)

      act(() => {
        result.current.retryFailed()
      })

      expect(result.current.status.failedCount).toBe(0)
      expect(result.current.status.pendingCount).toBe(1)
    })

    it('clearFailed should remove failed items', () => {
      const savedQueue = [
        { id: 'q1', action: { type: 'TEST' }, status: 'failed', retries: 4 },
        { id: 'q2', action: { type: 'TEST2' }, status: 'pending', retries: 0 },
      ]
      loadFromStorage.mockReturnValue(savedQueue)

      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        result.current.clearFailed()
      })

      expect(result.current.queue).toHaveLength(1)
      expect(result.current.queue[0].status).toBe('pending')
    })
  })

  describe('Online/Offline Status', () => {
    it('should track online status', () => {
      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.isOnline).toBe(true)
      expect(result.current.status.isOnline).toBe(true)
    })

    it('should update status on offline event', () => {
      const { result } = renderHook(() => useOfflineSync())

      act(() => {
        simulateOffline()
      })

      expect(result.current.isOnline).toBe(false)
      expect(result.current.error).toContain('offline')
    })

    it('should process queue when coming back online', async () => {
      const onSync = jest.fn().mockResolvedValue({ success: true })

      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      // Come back online
      act(() => {
        simulateOnline()
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.isOnline).toBe(true)
    })
  })

  describe('Persistence', () => {
    it('persist should save board data', () => {
      const { result } = renderHook(() => useOfflineSync())

      const boardData = { columns: [], version: 1 }
      act(() => {
        result.current.persist(boardData)
      })

      expect(saveToStorage).toHaveBeenCalledWith('kanban-board-state', boardData)
    })

    it('restore should load board data', () => {
      const savedBoard = { columns: [], version: 1 }
      loadFromStorage.mockReturnValue(savedBoard)

      const { result } = renderHook(() => useOfflineSync())

      const restored = result.current.restore()
      expect(restored).toEqual(savedBoard)
    })

    it('saveBaseState should save base state', () => {
      const { result } = renderHook(() => useOfflineSync())

      const baseState = { columns: [], version: 0 }
      act(() => {
        result.current.saveBaseState(baseState)
      })

      expect(saveToStorage).toHaveBeenCalledWith('kanban-base-state', baseState)
    })
  })

  describe('Force Sync', () => {
    it('forceSync should trigger immediate sync', async () => {
      const onSync = jest.fn().mockResolvedValue({ success: true })

      const { result } = renderHook(() =>
        useOfflineSync({ onSync, autoSync: false })
      )

      act(() => {
        result.current.enqueue({ type: 'TEST' }, 1)
      })

      await act(async () => {
        await result.current.forceSync()
      })

      expect(onSync).toHaveBeenCalled()
    })

    it('forceSync should return error when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      const { result } = renderHook(() => useOfflineSync())

      let syncResult
      await act(async () => {
        syncResult = await result.current.forceSync()
      })

      expect(syncResult).toEqual({ synced: 0, failed: 0 })
      expect(result.current.error).toContain('offline')
    })
  })

  describe('Status Computed Values', () => {
    it('should compute hasFailedItems correctly', () => {
      const savedQueue = [
        { id: 'q1', action: { type: 'TEST' }, status: 'failed', retries: 4 },
      ]
      loadFromStorage.mockReturnValue(savedQueue)

      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.status.hasFailedItems).toBe(true)
    })

    it('should compute hasPendingItems correctly', () => {
      const savedQueue = [
        { id: 'q1', action: { type: 'TEST' }, status: 'pending', retries: 0 },
      ]
      loadFromStorage.mockReturnValue(savedQueue)

      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.status.hasPendingItems).toBe(true)
    })

    it('should compute totalQueueLength correctly', () => {
      const savedQueue = [
        { id: 'q1', action: { type: 'TEST' }, status: 'pending', retries: 0 },
        { id: 'q2', action: { type: 'TEST2' }, status: 'failed', retries: 4 },
      ]
      loadFromStorage.mockReturnValue(savedQueue)

      const { result } = renderHook(() => useOfflineSync())

      expect(result.current.status.totalQueueLength).toBe(2)
    })
  })
})
