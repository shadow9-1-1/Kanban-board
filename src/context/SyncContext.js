/**
 * Sync Context
 *
 * React Context for sync/offline state management.
 */

import { createContext } from 'react'

/**
 * SyncContext
 *
 * Provides sync status and online state to components.
 *
 * Value shape:
 * {
 *   isOnline: boolean,
 *   syncStatus: { total, pending, processing, failed },
 *   lastSyncAt: Date | null,
 *   isSyncing: boolean,
 *   error: string | null,
 *   forceSync: () => Promise<void>,
 *   clearFailed: () => void,
 *   retryFailed: () => void,
 * }
 */
export const SyncContext = createContext(null)
SyncContext.displayName = 'SyncContext'
