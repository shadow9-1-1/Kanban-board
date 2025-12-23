/**
 * Custom hook for accessing Sync context
 */

import { useContext } from 'react'
import { SyncContext } from './SyncContext'

/**
 * Hook to access sync status and controls
 *
 * @returns {Object} Sync context value
 * @throws {Error} If used outside SyncProvider
 *
 * @example
 * const { isOnline, syncStatus, forceSync } = useSync()
 *
 * // Check if online
 * if (!isOnline) {
 *   showOfflineIndicator()
 * }
 *
 * // Check pending syncs
 * if (syncStatus.pending > 0) {
 *   showSyncBadge(syncStatus.pending)
 * }
 *
 * // Force sync manually
 * await forceSync()
 */
export const useSync = () => {
  const context = useContext(SyncContext)

  if (context === null) {
    throw new Error('useSync must be used within a SyncProvider')
  }

  return context
}
