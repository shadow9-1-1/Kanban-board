// useSync - Hook for accessing sync context
import { useContext } from 'react'
import { SyncContext } from './SyncContext'

// Access sync status and controls
export const useSync = () => {
  const context = useContext(SyncContext)
  if (context === null) throw new Error('useSync must be used within a SyncProvider')
  return context
}
