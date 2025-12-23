// SyncStatus - Visual indicator for sync/offline status
import PropTypes from 'prop-types'
import { useSync } from '../context/useSync'

// Format relative time (e.g., "2 min ago")
const formatRelativeTime = (date) => {
  if (!date) return 'Never'
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return date.toLocaleDateString()
}

// Online/Offline indicator dot
function StatusDot({ isOnline }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true" />
  )
}

StatusDot.propTypes = {
  isOnline: PropTypes.bool.isRequired,
}

function SyncStatus() {
  const { isOnline, syncStatus, lastSyncAt, isSyncing, error, forceSync, clearFailed, retryFailed } = useSync()
  const { pending, failed } = syncStatus

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <StatusDot isOnline={isOnline} />
        <span className={isOnline ? 'text-gray-600' : 'text-red-600'}>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {pending > 0 && (
        <div className="flex items-center gap-1.5 text-amber-600">
          <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span>{pending} pending</span>
        </div>
      )}

      {isSyncing && (
        <div className="flex items-center gap-1.5 text-blue-600">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Syncing...</span>
        </div>
      )}

      {failed > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-red-600">{failed} failed</span>
          <button onClick={retryFailed} className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 hover:bg-red-200">Retry</button>
          <button onClick={clearFailed} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200">Clear</button>
        </div>
      )}

      {lastSyncAt && !isSyncing && pending === 0 && failed === 0 && (
        <span className="text-gray-400">Synced {formatRelativeTime(lastSyncAt)}</span>
      )}

      {isOnline && !isSyncing && (
        <button onClick={forceSync} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Force sync" aria-label="Force sync">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-red-100 p-4 text-red-700 shadow-lg">
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SyncStatus
