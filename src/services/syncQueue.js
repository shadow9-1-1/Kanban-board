// Sync Queue Service - Manages pending actions for offline sync
import { generateId } from '../utils'
import { loadFromStorage, saveToStorage } from '../utils'

const QUEUE_STORAGE_KEY = 'kanban-sync-queue'
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 15000]

// SyncQueue Class - Singleton that manages the sync queue lifecycle
class SyncQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.listeners = new Set()
    this.onSync = null
    this.onRevert = null
    this._loadQueue()
  }

  // Subscribe to queue changes
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify all listeners of queue change
  _notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getStatus()))
  }

  // Load queue from localStorage
  _loadQueue() {
    try {
      const saved = loadFromStorage(QUEUE_STORAGE_KEY)
      if (saved && Array.isArray(saved)) {
        this.queue = saved.map((item) => ({
          ...item,
          status: item.status === 'processing' ? 'pending' : item.status,
        }))
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.queue = []
    }
  }

  // Persist queue to localStorage
  _saveQueue() {
    try {
      saveToStorage(QUEUE_STORAGE_KEY, this.queue)
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  // Add action to the queue
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
    console.log('[SyncQueue] Enqueued:', action.type, item.id)
    return item.id
  }

  // Remove item from queue on success
  dequeue(itemId) {
    this.queue = this.queue.filter((item) => item.id !== itemId)
    this._saveQueue()
    this._notifyListeners()
  }

  // Mark item as failed
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

  // Get current queue status
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

  // Get pending count
  getPendingCount() {
    return this.queue.filter((i) => i.status === 'pending').length
  }

  // Process the queue - sync pending items with server
  async processQueue(isOnline = navigator.onLine) {
    if (!isOnline) {
      console.log('[SyncQueue] Offline - skipping sync')
      return { synced: 0, failed: 0 }
    }

    if (this.isProcessing) {
      console.log('[SyncQueue] Already processing')
      return { synced: 0, failed: 0 }
    }

    if (this.queue.length === 0) {
      return { synced: 0, failed: 0 }
    }

    this.isProcessing = true
    this._notifyListeners()

    const results = { synced: 0, failed: 0, reverted: [] }

    for (const item of [...this.queue]) {
      if (item.status === 'failed' && item.retries >= MAX_RETRIES) {
        console.log('[SyncQueue] Max retries exceeded, reverting:', item.id)
        results.reverted.push(item)
        this.dequeue(item.id)
        if (this.onRevert) this.onRevert(item)
        continue
      }

      item.status = 'processing'
      this._saveQueue()
      this._notifyListeners()

      try {
        if (this.onSync) await this.onSync(item)
        console.log('[SyncQueue] Synced:', item.action.type, item.id)
        this.dequeue(item.id)
        results.synced++
      } catch (error) {
        console.error('[SyncQueue] Sync failed:', item.id, error)
        const retryDelay = RETRY_DELAYS[Math.min(item.retries, RETRY_DELAYS.length - 1)]
        this.markFailed(item.id, error.message || 'Sync failed')
        results.failed++

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
    console.log('[SyncQueue] Process complete:', results)
    return results
  }

  // Clear all failed items
  clearFailed() {
    const failed = this.queue.filter((i) => i.status === 'failed')
    failed.forEach((item) => {
      if (this.onRevert) this.onRevert(item)
    })
    this.queue = this.queue.filter((i) => i.status !== 'failed')
    this._saveQueue()
    this._notifyListeners()
  }

  // Retry all failed items
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

  // Clear entire queue
  clear() {
    this.queue = []
    this._saveQueue()
    this._notifyListeners()
  }
}

export const syncQueue = new SyncQueue()
export { SyncQueue }
