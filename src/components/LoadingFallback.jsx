// LoadingFallback Components - Suspense fallback UI for lazy-loaded components
import PropTypes from 'prop-types'

// Spinner component - reusable loading indicator
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

  return (
    <svg className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
}

// Modal Loading Fallback - centered spinner in modal overlay
export function ModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Loading modal">
      <div className="rounded-xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    </div>
  )
}

// Card Detail Modal Fallback - skeleton UI matching CardDetailModal layout
export function CardDetailModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Loading card details">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <div className="mb-2 h-4 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
          </div>
          <div>
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-24 w-full animate-pulse rounded bg-gray-100" />
          </div>
          <div>
            <div className="mb-2 h-4 w-12 animate-pulse rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 p-4">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-blue-200" />
        </div>
      </div>
    </div>
  )
}

// Conflict Resolution Modal Fallback - skeleton UI matching ConflictResolutionModal layout
export function ConflictResolutionModalFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Loading conflict resolution">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-amber-200" />
            <div>
              <div className="mb-1 h-6 w-48 animate-pulse rounded bg-amber-200" />
              <div className="h-4 w-64 animate-pulse rounded bg-amber-100" />
            </div>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 h-5 w-28 animate-pulse rounded bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between border-t border-gray-200 p-4">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-9 w-32 animate-pulse rounded-lg bg-blue-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Confirm Dialog Fallback - skeleton UI matching ConfirmDialog layout
export function ConfirmDialogFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Loading confirmation">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 h-12 w-12 animate-pulse rounded-full bg-red-100" />
          <div className="mb-2 h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mb-6 h-4 w-64 animate-pulse rounded bg-gray-100" />
          <div className="flex gap-3">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-red-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Generic Component Fallback - simple loading state for any component
export function ComponentFallback({ height = 'h-32', message = 'Loading component...' }) {
  return (
    <div className={`flex ${height} w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50`}>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  )
}

ComponentFallback.propTypes = {
  height: PropTypes.string,
  message: PropTypes.string,
}

export default { Spinner, ModalFallback, CardDetailModalFallback, ConflictResolutionModalFallback, ConfirmDialogFallback, ComponentFallback }
