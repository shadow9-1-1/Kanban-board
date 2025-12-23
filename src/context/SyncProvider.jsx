/**
 * Sync Provider
 *
 * Manages online/offline detection and background sync.
 *
 * FEATURES:
 * =========
 * 1. Online/offline detection via navigator.onLine + events
 * 2. Periodic background sync (30-60s when online)
 * 3. Immediate sync on reconnection
 * 4. Sync queue integration
 * 5. Status reporting for UI
 *
 * SYNC TRIGGERS:
 * ==============
 * - App becomes online
 * - Periodic timer (configurable)
 * - Manual force sync
 * - After each action (if online)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { SyncContext } from './SyncContext'
import { syncQueue } from '../services'
import { api } from '../services'

// Sync interval: 30-60 seconds (randomized to avoid thundering herd)
const SYNC_INTERVAL_MIN = 30000 // 30s
const SYNC_INTERVAL_MAX = 60000 // 60s

/**
 * Get random sync interval
 */
const getRandomInterval = () =>
  Math.floor(Math.random() * (SYNC_INTERVAL_MAX - SYNC_INTERVAL_MIN)) + SYNC_INTERVAL_MIN

/**
 * SyncProvider Component
 *
 * Wraps application with sync/offline state.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Function} props.onSyncSuccess - Called on successful sync with server data
 * @param {Function} props.onRevert - Called when action needs to be reverted
 * @param {Function} props.getVersion - Function to get current board version
 */
export const SyncProvider = ({ children, onSyncSuccess, onRevert }) => {
  // Online status
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  // Sync status from queue
  const [syncStatus, setSyncStatus] = useState(() => syncQueue.getStatus())

  // Last successful sync timestamp
  const [lastSyncAt, setLastSyncAt] = useState(null)

  // Current error message
  const [error, setError] = useState(null)

  // Ref for interval timer
  const syncIntervalRef = useRef(null)

  // Ref to track if component is mounted
  const isMountedRef = useRef(true)

  /**
   * Sync handler - sends action to server
   */
  const handleSync = useCallback(
    async (queueItem) => {
      const { action, version } = queueItem

      // Use generic sync endpoint
      const response = await api.syncAction(action, version)

      // On success, notify parent of new version
      if (onSyncSuccess && response.version) {
        onSyncSuccess(response)
      }

      return response
    },
    [onSyncSuccess]
  )

  /**
   * Revert handler - called when sync permanently fails
   */
  const handleRevert = useCallback(
    (queueItem) => {
      // eslint-disable-next-line no-console
      console.log('[SyncProvider] Reverting action:', queueItem.action.type)

      if (onRevert) {
        onRevert(queueItem)
      }

      // Set error for UI display
      setError(`Failed to sync: ${queueItem.action.type}. Changes have been reverted.`)

      // Clear error after 5 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setError(null)
        }
      }, 5000)
    },
    [onRevert]
  )

  /**
   * Force sync - manually trigger queue processing
   */
  const forceSync = useCallback(async () => {
    setError(null)

    try {
      const results = await syncQueue.processQueue(isOnline)

      if (results.synced > 0) {
        setLastSyncAt(new Date())
      }

      if (results.failed > 0) {
        setError(`${results.failed} item(s) failed to sync`)
      }

      return results
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [isOnline])

  /**
   * Clear all failed items
   */
  const clearFailed = useCallback(() => {
    syncQueue.clearFailed()
    setError(null)
  }, [])

  /**
   * Retry failed items
   */
  const retryFailed = useCallback(() => {
    syncQueue.retryFailed()
    setError(null)
    forceSync()
  }, [forceSync])

  // ==================== EFFECTS ====================

  /**
   * Setup sync queue callbacks
   */
  useEffect(() => {
    syncQueue.onSync = handleSync
    syncQueue.onRevert = handleRevert

    return () => {
      syncQueue.onSync = null
      syncQueue.onRevert = null
    }
  }, [handleSync, handleRevert])

  /**
   * Subscribe to queue status changes
   */
  useEffect(() => {
    const unsubscribe = syncQueue.subscribe((status) => {
      if (isMountedRef.current) {
        setSyncStatus(status)
      }
    })

    return unsubscribe
  }, [])

  /**
   * Online/offline event listeners
   */
  useEffect(() => {
    const handleOnline = () => {
      // eslint-disable-next-line no-console
      console.log('[SyncProvider] Online')
      setIsOnline(true)
      setError(null)

      // Immediate sync on reconnection
      forceSync()
    }

    const handleOffline = () => {
      // eslint-disable-next-line no-console
      console.log('[SyncProvider] Offline')
      setIsOnline(false)
      setError('You are offline. Changes will sync when reconnected.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [forceSync])

  /**
   * Periodic background sync
   */
  useEffect(() => {
    const scheduleNextSync = () => {
      if (syncIntervalRef.current) {
        clearTimeout(syncIntervalRef.current)
      }

      const interval = getRandomInterval()

      syncIntervalRef.current = setTimeout(async () => {
        if (isMountedRef.current && isOnline) {
          // eslint-disable-next-line no-console
          console.log('[SyncProvider] Periodic sync')
          await forceSync()
        }
        scheduleNextSync()
      }, interval)
    }

    if (isOnline) {
      scheduleNextSync()
    }

    return () => {
      if (syncIntervalRef.current) {
        clearTimeout(syncIntervalRef.current)
      }
    }
  }, [isOnline, forceSync])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ==================== CONTEXT VALUE ====================

  const contextValue = useMemo(
    () => ({
      isOnline,
      syncStatus,
      lastSyncAt,
      isSyncing: syncStatus.isProcessing,
      error,
      forceSync,
      clearFailed,
      retryFailed,
    }),
    [isOnline, syncStatus, lastSyncAt, error, forceSync, clearFailed, retryFailed]
  )

  return <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
}

SyncProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onSyncSuccess: PropTypes.func,
  onRevert: PropTypes.func,
}

SyncProvider.defaultProps = {
  onSyncSuccess: null,
  onRevert: null,
}
