/**
 * Sync Queue Service
 *
 * Manages a queue of pending actions to sync with the server.
 * Supports offline operation with automatic retry.
 *
 * ARCHITECTURE:
 * ============
 *
 *    ┌─────────────┐    dispatch    ┌─────────────┐
 *    │  Component  │ ─────────────► │ SyncQueue   │
 *    └─────────────┘                └──────┬──────┘
 *                                          │
 *                    ┌─────────────────────┼─────────────────────┐
 *                    │ Online              │ Offline             │
 *                    ▼                     ▼                     │
 *             ┌─────────────┐       ┌─────────────┐              │
 *             │   Server    │       │ localStorage│              │
 *             └──────┬──────┘       └──────┬──────┘              │
 *                    │                     │                     │
 *                    ▼                     │ (when online)       │
 *             ┌─────────────┐              │                     │
 *             │  Confirm/   │◄─────────────┘                     │
 *             │  Revert UI  │                                    │
 *             └─────────────┘                                    │
 *
 * QUEUE ITEM STRUCTURE:
 * {
 *   id: string,           // Unique queue item ID
 *   action: Object,       // The action to sync { type, payload }
 *   timestamp: number,    // When action was created
 *   retries: number,      // Number of retry attempts
 *   status: 'pending' | 'processing' | 'failed',
 *   error: string | null, // Last error message
 *   version: number       // Optimistic version number
 * }
 */

import { generateId } from '../utils'
import { loadFromStorage, saveToStorage } from '../utils'

const QUEUE_STORAGE_KEY = 'kanban-sync-queue'
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 15000] // Exponential backoff in ms

/**
 * SyncQueue Class
 *
 * Singleton that manages the sync queue lifecycle.
 */
class SyncQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.listeners = new Set()
    this.onSync = null // Callback for sync operations
    this.onRevert = null // Callback to revert optimistic updates

    // Load persisted queue on init
    this._loadQueue()
  }

  /**
   * Subscribe to queue changes
   * @param {Function} listener - Callback on queue change
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of queue change
   */
  _notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getStatus()))
  }

  /**
   * Load queue from localStorage
   */
  _loadQueue() {
    try {
      const saved = loadFromStorage(QUEUE_STORAGE_KEY)
      if (saved && Array.isArray(saved)) {
        // Reset processing status on load (app restart)
        this.queue = saved.map((item) => ({
          ...item,
          status: item.status === 'processing' ? 'pending' : item.status,
        }))
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load sync queue:', error)
      this.queue = []
    }
  }

  /**
   * Persist queue to localStorage
   */
  _saveQueue() {
    try {
      saveToStorage(QUEUE_STORAGE_KEY, this.queue)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save sync queue:', error)
    }
  }

  /**
   * Add action to the queue
   *
   * @param {Object} action - Action to queue { type, payload }
   * @param {number} version - Current board version for conflict detection
   * @returns {string} Queue item ID
   */
  enqueue(action, version) {
    const item = {
      id: generateId(),
      action,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
      error: null,
      version,
    }

    this.queue.push(item)
    this._saveQueue()
    this._notifyListeners()

    // eslint-disable-next-line no-console
    console.log('[SyncQueue] Enqueued:', action.type, item.id)

    return item.id
  }

  /**
   * Remove item from queue (on success)
   * @param {string} itemId - Queue item ID
   */
  dequeue(itemId) {
    this.queue = this.queue.filter((item) => item.id !== itemId)
    this._saveQueue()
    this._notifyListeners()
  }

  /**
   * Mark item as failed
   * @param {string} itemId - Queue item ID
   * @param {string} error - Error message
   */
  markFailed(itemId, error) {
    const item = this.queue.find((i) => i.id === itemId)
    if (item) {
      item.status = 'failed'
      item.error = error
      item.retries += 1
      this._saveQueue()
      this._notifyListeners()
    }
  }

  /**
   * Get current queue status
   * @returns {Object} Status summary
   */
  getStatus() {
    const pending = this.queue.filter((i) => i.status === 'pending').length
    const failed = this.queue.filter((i) => i.status === 'failed').length
    const processing = this.queue.filter((i) => i.status === 'processing').length

    return {
      total: this.queue.length,
      pending,
      processing,
      failed,
      isProcessing: this.isProcessing,
      items: [...this.queue],
    }
  }

  /**
   * Process the queue - sync pending items with server
   *
   * @param {boolean} isOnline - Current online status
   * @returns {Promise<Object>} Sync results
   */
  async processQueue(isOnline = navigator.onLine) {
    if (!isOnline) {
      // eslint-disable-next-line no-console
      console.log('[SyncQueue] Offline - skipping sync')
      return { synced: 0, failed: 0 }
    }

    if (this.isProcessing) {
      // eslint-disable-next-line no-console
      console.log('[SyncQueue] Already processing')
      return { synced: 0, failed: 0 }
    }

    if (this.queue.length === 0) {
      return { synced: 0, failed: 0 }
    }

    this.isProcessing = true
    this._notifyListeners()

    const results = { synced: 0, failed: 0, reverted: [] }

    // Process items in order (FIFO)
    for (const item of [...this.queue]) {
      if (item.status === 'failed' && item.retries >= MAX_RETRIES) {
        // Max retries exceeded - revert and remove
        // eslint-disable-next-line no-console
        console.log('[SyncQueue] Max retries exceeded, reverting:', item.id)
        results.reverted.push(item)
        this.dequeue(item.id)

        // Trigger revert callback
        if (this.onRevert) {
          this.onRevert(item)
        }
        continue
      }

      // Mark as processing
      item.status = 'processing'
      this._saveQueue()
      this._notifyListeners()

      try {
        // Attempt sync
        if (this.onSync) {
          await this.onSync(item)
        }

        // Success - remove from queue
        // eslint-disable-next-line no-console
        console.log('[SyncQueue] Synced:', item.action.type, item.id)
        this.dequeue(item.id)
        results.synced++
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[SyncQueue] Sync failed:', item.id, error)

        // Calculate retry delay
        const retryDelay = RETRY_DELAYS[Math.min(item.retries, RETRY_DELAYS.length - 1)]

        this.markFailed(item.id, error.message || 'Sync failed')
        results.failed++

        // Schedule retry after delay
        if (item.retries < MAX_RETRIES) {
          setTimeout(() => {
            const retryItem = this.queue.find((i) => i.id === item.id)
            if (retryItem) {
              retryItem.status = 'pending'
              this._saveQueue()
            }
          }, retryDelay)
        }
      }
    }

    this.isProcessing = false
    this._notifyListeners()

    // eslint-disable-next-line no-console
    console.log('[SyncQueue] Process complete:', results)

    return results
  }

  /**
   * Clear all failed items (user action)
   */
  clearFailed() {
    const failed = this.queue.filter((i) => i.status === 'failed')
    failed.forEach((item) => {
      if (this.onRevert) {
        this.onRevert(item)
      }
    })

    this.queue = this.queue.filter((i) => i.status !== 'failed')
    this._saveQueue()
    this._notifyListeners()
  }

  /**
   * Retry all failed items
   */
  retryFailed() {
    this.queue.forEach((item) => {
      if (item.status === 'failed') {
        item.status = 'pending'
        item.retries = 0
      }
    })
    this._saveQueue()
    this._notifyListeners()
  }

  /**
   * Clear entire queue (use with caution)
   */
  clear() {
    this.queue = []
    this._saveQueue()
    this._notifyListeners()
  }
}

// Singleton instance
export const syncQueue = new SyncQueue()

// Export class for testing
export { SyncQueue }
