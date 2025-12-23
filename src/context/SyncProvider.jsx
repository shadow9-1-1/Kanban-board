// Sync Provider - Manages online/offline state and background sync
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import { SyncContext } from './SyncContext'
import { syncQueue } from '../services'
import { api } from '../services/api'
import { isDev } from '../utils/env'

const SYNC_INTERVAL = 30000

// SyncProvider component provides sync context to the app
export const SyncProvider = ({ children, onConflict, getCurrentState }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState({ pending: 0, lastSync: null, error: null })
  const syncIntervalRef = useRef(null)

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (isDev) console.log('App is online, triggering sync')
      syncQueue.processQueue(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      if (isDev) console.log('App is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update sync status from queue
  useEffect(() => {
    const updateStatus = () => {
      const pending = syncQueue.getPendingCount()
      setSyncStatus((prev) => ({ ...prev, pending }))
    }

    updateStatus()
    const interval = setInterval(updateStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  // Background sync interval
  useEffect(() => {
    if (isOnline) {
      syncIntervalRef.current = setInterval(() => {
        if (isDev) console.log('Background sync tick')
        syncQueue.processQueue(false)
      }, SYNC_INTERVAL)
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [isOnline])

  // Force sync manually
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      if (isDev) console.log('Cannot sync while offline')
      return { success: false, error: 'Offline' }
    }

    try {
      setSyncStatus((prev) => ({ ...prev, error: null }))
      await syncQueue.processQueue(true)

      const currentState = getCurrentState()
      const serverResponse = await api.getBoard()

      if (serverResponse.version > currentState.board.version) {
        if (onConflict) {
          onConflict({
            conflicts: [],
            localState: currentState,
            serverState: serverResponse,
            baseState: null,
          })
        }
      }

      setSyncStatus((prev) => ({ ...prev, lastSync: new Date().toISOString() }))
      return { success: true }
    } catch (error) {
      setSyncStatus((prev) => ({ ...prev, error: error.message }))
      return { success: false, error: error.message }
    }
  }, [isOnline, getCurrentState, onConflict])

  const contextValue = useMemo(
    () => ({
      isOnline,
      syncStatus,
      forceSync,
    }),
    [isOnline, syncStatus, forceSync]
  )

  return <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
}

SyncProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onConflict: PropTypes.func,
  getCurrentState: PropTypes.func,
}

SyncProvider.defaultProps = {
  onConflict: null,
  getCurrentState: () => ({}),
}
