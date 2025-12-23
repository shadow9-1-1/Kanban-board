// useOfflineSync - Manages offline persistence, sync queue, and automatic retries
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { saveToStorage, loadFromStorage } from '../utils'

const BOARD_STORAGE_KEY = 'kanban-board-state'
const QUEUE_STORAGE_KEY = 'kanban-sync-queue'
const BASE_STATE_KEY = 'kanban-base-state'
const MAX_RETRIES = 4
const RETRY_DELAYS = [0, 1000, 5000, 15000]
const SYNC_THROTTLE = 500
const SYNC_INTERVAL_MIN = 30000
const SYNC_INTERVAL_MAX = 60000

// Generate unique queue item ID
const generateQueueId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Get random interval for background sync
const getRandomSyncInterval = () => Math.floor(Math.random() * (SYNC_INTERVAL_MAX - SYNC_INTERVAL_MIN)) + SYNC_INTERVAL_MIN

// Hook for offline-first data management with sync queue
export const useOfflineSync = (options = {}) => {
  const { onSync, onConflict, onSyncSuccess, onSyncError, autoSync = true } = options

  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [queue, setQueue] = useState(() => {
    const saved = loadFromStorage(QUEUE_STORAGE_KEY)
    if (saved && Array.isArray(saved)) {
      return saved.map((item) => ({ ...item, status: item.status === 'processing' ? 'pending' : item.status }))
    }
    return []
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [error, setError] = useState(null)

  const queueRef = useRef(queue)
  queueRef.current = queue
  const lastSyncAttemptRef = useRef(0)
  const syncTimerRef = useRef(null)
  const retryTimersRef = useRef(new Map())
  const isMountedRef = useRef(true)

  // Save queue to localStorage on change
  useEffect(() => {
    saveToStorage(QUEUE_STORAGE_KEY, queue)
    queueRef.current = queue
  }, [queue])

  // Persist board data to localStorage
  const persist = useCallback((boardData) => {
    try {
      saveToStorage(BOARD_STORAGE_KEY, boardData)
      return true
    } catch (err) {
      console.error('Failed to persist board data:', err)
      return false
    }
  }, [])

  // Restore board data from localStorage
  const restore = useCallback(() => {
    try {
      return loadFromStorage(BOARD_STORAGE_KEY)
    } catch (err) {
      console.error('Failed to restore board data:', err)
      return null
    }
  }, [])

  // Save base state for conflict detection
  const saveBaseState = useCallback((state) => {
    try {
      saveToStorage(BASE_STATE_KEY, state)
    } catch (err) {
      console.error('Failed to save base state:', err)
    }
  }, [])

  // Get base state for conflict detection
  const getBaseState = useCallback(() => loadFromStorage(BASE_STATE_KEY), [])

  // Add action to sync queue
  const enqueue = useCallback((action, version) => {
    const item = { id: generateQueueId(), action, timestamp: Date.now(), retries: 0, status: 'pending', error: null, version }
    setQueue((prev) => [...prev, item])
    if (navigator.onLine) setTimeout(() => processQueue(), 100)
    return item.id
  }, [])

  // Update a queue item
  const updateQueueItem = useCallback((id, updates) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  // Remove a queue item
  const removeQueueItem = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  // Clear all failed items
  const clearFailed = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status !== 'failed'))
    setError(null)
  }, [])

  // Retry all failed items
  const retryFailed = useCallback(() => {
    setQueue((prev) => prev.map((item) => (item.status === 'failed' ? { ...item, status: 'pending', retries: 0 } : item)))
    setError(null)
  }, [])

  // Process a single queue item
  const processItem = useCallback(async (item) => {
    if (!onSync) {
      console.warn('useOfflineSync: No onSync handler provided')
      return false
    }
    updateQueueItem(item.id, { status: 'processing' })
    try {
      const result = await onSync(item.action, item.version)
      removeQueueItem(item.id)
      if (onSyncSuccess) onSyncSuccess(result, item)
      return true
    } catch (err) {
      if (err.status === 409 && onConflict) {
        onConflict(err.response?.serverState, item)
        updateQueueItem(item.id, { status: 'failed', error: 'Conflict detected - requires resolution' })
        return false
      }
      const newRetries = item.retries + 1
      if (newRetries >= MAX_RETRIES) {
        updateQueueItem(item.id, { status: 'failed', retries: newRetries, error: err.message || 'Sync failed after multiple attempts' })
        if (onSyncError) onSyncError(err, item)
        return false
      }
      updateQueueItem(item.id, { status: 'pending', retries: newRetries, error: err.message })
      const delay = RETRY_DELAYS[newRetries] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
      const timerId = setTimeout(() => {
        if (isMountedRef.current && navigator.onLine) processQueue()
        retryTimersRef.current.delete(item.id)
      }, delay)
      retryTimersRef.current.set(item.id, timerId)
      return false
    }
  }, [onSync, onConflict, onSyncSuccess, onSyncError, updateQueueItem, removeQueueItem])

  // Process all pending items in queue
  const processQueue = useCallback(async () => {
    const now = Date.now()
    if (now - lastSyncAttemptRef.current < SYNC_THROTTLE) return { synced: 0, failed: 0 }
    lastSyncAttemptRef.current = now
    if (!navigator.onLine || isSyncing) return { synced: 0, failed: 0 }
    const pending = queueRef.current.filter((item) => item.status === 'pending')
    if (pending.length === 0) return { synced: 0, failed: 0 }
    setIsSyncing(true)
    setError(null)
    let synced = 0
    let failed = 0
    for (const item of pending) {
      if (!isMountedRef.current) break
      const success = await processItem(item)
      if (success) synced++
      else failed++
    }
    if (isMountedRef.current) {
      setIsSyncing(false)
      if (synced > 0) setLastSyncAt(new Date())
      if (failed > 0) setError(`${failed} item(s) failed to sync`)
    }
    return { synced, failed }
  }, [isSyncing, processItem])

  // Force sync - manually trigger queue processing
  const forceSync = useCallback(async () => {
    if (!navigator.onLine) {
      setError('Cannot sync while offline')
      return { synced: 0, failed: 0 }
    }
    lastSyncAttemptRef.current = 0
    return processQueue()
  }, [processQueue])

  // Online/offline event handlers
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setError(null); processQueue() }
    const handleOffline = () => { setIsOnline(false); setError('You are offline. Changes will sync when reconnected.') }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [processQueue])

  // Background sync timer
  useEffect(() => {
    if (!autoSync) return
    const scheduleNextSync = () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      const interval = getRandomSyncInterval()
      syncTimerRef.current = setTimeout(() => {
        if (isMountedRef.current && navigator.onLine) processQueue()
        scheduleNextSync()
      }, interval)
    }
    if (isOnline) scheduleNextSync()
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current) }
  }, [autoSync, isOnline, processQueue])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      retryTimersRef.current.forEach((timerId) => clearTimeout(timerId))
      retryTimersRef.current.clear()
    }
  }, [])

  // Computed sync status
  const status = useMemo(() => ({
    isOnline,
    isSyncing,
    pendingCount: queue.filter((item) => item.status === 'pending').length,
    failedCount: queue.filter((item) => item.status === 'failed').length,
    processingCount: queue.filter((item) => item.status === 'processing').length,
    totalQueueLength: queue.length,
    lastSyncAt,
    error,
    hasFailedItems: queue.some((item) => item.status === 'failed'),
    hasPendingItems: queue.some((item) => item.status === 'pending'),
  }), [isOnline, isSyncing, queue, lastSyncAt, error])

  return {
    status, isOnline, isSyncing, error,
    enqueue, processQueue, forceSync, retryFailed, clearFailed,
    queue,
    getQueueItem: useCallback((id) => queue.find((item) => item.id === id), [queue]),
    getPendingItems: useCallback(() => queue.filter((item) => item.status === 'pending'), [queue]),
    getFailedItems: useCallback(() => queue.filter((item) => item.status === 'failed'), [queue]),
    persist, restore, saveBaseState, getBaseState,
  }
}

export default useOfflineSync
