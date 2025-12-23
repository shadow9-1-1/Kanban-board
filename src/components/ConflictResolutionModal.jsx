// ConflictResolutionModal - Modal for resolving merge conflicts
import PropTypes from 'prop-types'
import { useState, useMemo, useRef, useEffect } from 'react'
import { ConflictType, ResolutionChoice, MergeStrategy, threeWayMerge } from '../services/conflictResolver'
import { useFocusTrap } from '../hooks/useAccessibility'

// Format a value for display
const formatValue = (value) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">deleted</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">empty</span>
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// Get conflict type label
const getConflictTypeLabel = (type) => {
  switch (type) {
    case ConflictType.SAME_FIELD: return 'Field Modified'
    case ConflictType.DELETE_MODIFY: return 'Delete vs Modify'
    case ConflictType.MOVE_CONFLICT: return 'Move Conflict'
    case ConflictType.ORDER_CONFLICT: return 'Order Changed'
    default: return 'Conflict'
  }
}

// Single conflict item display
const ConflictItem = ({ conflict, resolution, onResolve, index }) => {
  const [showCustom, setShowCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const customInputRef = useRef(null)

  useEffect(() => {
    if (showCustom && customInputRef.current) {
      customInputRef.current.focus()
    }
  }, [showCustom])

  const handleResolve = (choice) => {
    if (choice === ResolutionChoice.CUSTOM) {
      setShowCustom(true)
    } else {
      onResolve(conflict.id, { choice })
    }
  }

  const handleCustomSubmit = () => {
    let parsedValue = customValue
    if (Array.isArray(conflict.localValue) || Array.isArray(conflict.serverValue)) {
      try {
        parsedValue = customValue.split(',').map((s) => s.trim()).filter(Boolean)
      } catch {
        parsedValue = customValue
      }
    }
    onResolve(conflict.id, { choice: ResolutionChoice.CUSTOM, value: parsedValue })
    setShowCustom(false)
  }

  const isResolved = !!resolution
  const conflictId = `conflict-${conflict.id}`

  return (
    <div
      className={`border rounded-lg p-4 mb-4 ${isResolved ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}
      role="group"
      aria-labelledby={`${conflictId}-header`}
    >
      <div className="flex items-center justify-between mb-3" id={`${conflictId}-header`}>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${conflict.type === ConflictType.DELETE_MODIFY ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {getConflictTypeLabel(conflict.type)}
          </span>
          <span className="text-sm text-gray-700">
            {conflict.entity}: {conflict.entityId?.slice(0, 8)}...
            {conflict.field && ` → ${conflict.field}`}
          </span>
        </div>
        {isResolved && <span className="text-green-600 text-sm font-medium" aria-live="polite">✓ Resolved</span>}
      </div>

      <p className="text-sm text-gray-700 mb-4">{conflict.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded p-3 border border-blue-200">
          <div className="text-xs font-semibold text-blue-700 mb-1" aria-hidden="true">📱 Your Local Changes</div>
          <div className="text-sm font-mono bg-white p-2 rounded border overflow-auto max-h-24" aria-label={`Local value for conflict ${index + 1}`}>
            {formatValue(conflict.localValue)}
          </div>
        </div>
        <div className="bg-purple-50 rounded p-3 border border-purple-200">
          <div className="text-xs font-semibold text-purple-700 mb-1" aria-hidden="true">☁️ Server Version</div>
          <div className="text-sm font-mono bg-white p-2 rounded border overflow-auto max-h-24" aria-label={`Server value for conflict ${index + 1}`}>
            {formatValue(conflict.serverValue)}
          </div>
        </div>
      </div>

      {!showCustom && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Resolution options">
          <button
            type="button"
            onClick={() => handleResolve(ResolutionChoice.KEEP_LOCAL)}
            className={`px-3 py-1.5 text-sm rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              resolution?.choice === ResolutionChoice.KEEP_LOCAL ? 'bg-blue-600 text-white focus:ring-blue-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500'
            }`}
            aria-pressed={resolution?.choice === ResolutionChoice.KEEP_LOCAL}
          >
            Keep Local
          </button>
          <button
            type="button"
            onClick={() => handleResolve(ResolutionChoice.KEEP_SERVER)}
            className={`px-3 py-1.5 text-sm rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              resolution?.choice === ResolutionChoice.KEEP_SERVER ? 'bg-purple-600 text-white focus:ring-purple-500' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 focus:ring-purple-500'
            }`}
            aria-pressed={resolution?.choice === ResolutionChoice.KEEP_SERVER}
          >
            Keep Server
          </button>
          {(Array.isArray(conflict.localValue) || Array.isArray(conflict.serverValue)) && (
            <button
              type="button"
              onClick={() => {
                const merged = [...new Set([...(conflict.localValue || []), ...(conflict.serverValue || [])])]
                onResolve(conflict.id, { choice: ResolutionChoice.CUSTOM, value: merged })
              }}
              className={`px-3 py-1.5 text-sm rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                resolution?.choice === ResolutionChoice.KEEP_BOTH ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              aria-pressed={resolution?.choice === ResolutionChoice.KEEP_BOTH}
            >
              Merge Both
            </button>
          )}
          <button
            type="button"
            onClick={() => handleResolve(ResolutionChoice.CUSTOM)}
            className="px-3 py-1.5 text-sm rounded font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Custom...
          </button>
        </div>
      )}

      {showCustom && (
        <div className="flex gap-2" role="group" aria-label="Enter custom value">
          <label htmlFor={`${conflictId}-custom-input`} className="sr-only">Custom resolution value</label>
          <input
            ref={customInputRef}
            id={`${conflictId}-custom-input`}
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomSubmit()
              if (e.key === 'Escape') setShowCustom(false)
            }}
            placeholder="Enter custom value..."
            className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={handleCustomSubmit} className="px-3 py-1.5 text-sm rounded font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Apply</button>
          <button type="button" onClick={() => setShowCustom(false)} className="px-3 py-1.5 text-sm rounded font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cancel</button>
        </div>
      )}

      {isResolved && resolution.value !== undefined && (
        <div className="mt-3 p-2 bg-green-100 rounded border border-green-200" aria-live="polite">
          <span className="text-xs font-semibold text-green-700">Resolved value: </span>
          <span className="text-sm font-mono">{formatValue(resolution.value)}</span>
        </div>
      )}
    </div>
  )
}

ConflictItem.propTypes = {
  conflict: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    entity: PropTypes.string.isRequired,
    entityId: PropTypes.string,
    field: PropTypes.string,
    description: PropTypes.string.isRequired,
    localValue: PropTypes.any,
    serverValue: PropTypes.any,
    baseValue: PropTypes.any,
  }).isRequired,
  resolution: PropTypes.shape({
    choice: PropTypes.string.isRequired,
    value: PropTypes.any,
  }),
  onResolve: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
}

// ConflictResolutionModal Component
export const ConflictResolutionModal = ({
  isOpen,
  conflicts,
  localState,
  serverState,
  baseState,
  resolutions,
  onResolve,
  onApplyMerge,
  onDismiss,
}) => {
  const [previewMode, setPreviewMode] = useState(false)
  const previewButtonRef = useRef(null)

  const { containerRef } = useFocusTrap({
    isActive: isOpen,
    onEscape: onDismiss,
    autoFocus: false,
    restoreFocus: true,
  })

  useEffect(() => {
    if (isOpen && previewButtonRef.current) {
      requestAnimationFrame(() => {
        previewButtonRef.current?.focus()
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  const mergePreview = useMemo(() => {
    if (!baseState || !localState || !serverState) return null
    try {
      return threeWayMerge(baseState, localState, serverState, MergeStrategy.MANUAL, resolutions)
    } catch (error) {
      console.error('Merge preview error:', error)
      return null
    }
  }, [baseState, localState, serverState, resolutions])

  const allResolved = conflicts.every((c) => resolutions[c.id])
  const resolvedCount = Object.keys(resolutions).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="conflict-modal-title" aria-describedby="conflict-modal-desc">
      <div className="absolute inset-0 bg-black/50" onClick={onDismiss} aria-hidden="true" />

      <div ref={containerRef} className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4">
        <div className="flex items-center justify-between p-4 border-b bg-yellow-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">⚠️</span>
            <div>
              <h2 id="conflict-modal-title" className="text-lg font-bold text-gray-900">Merge Conflicts Detected</h2>
              <p id="conflict-modal-desc" className="text-sm text-gray-700">{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found • {resolvedCount} resolved</p>
            </div>
          </div>
          <button
            ref={previewButtonRef}
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 text-sm rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${previewMode ? 'bg-blue-600 text-white focus:ring-blue-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'}`}
            aria-pressed={previewMode}
          >
            {previewMode ? 'Hide Preview' : 'Preview Merge'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4" role="region" aria-label="Conflict details">
          {!previewMode ? (
            <>
              <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg" role="group" aria-label="Quick resolve all conflicts">
                <span className="text-sm text-gray-700 mr-2">Quick resolve all:</span>
                <button
                  type="button"
                  onClick={() => conflicts.forEach((c) => onResolve(c.id, { choice: ResolutionChoice.KEEP_LOCAL }))}
                  className="px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Keep All Local
                </button>
                <button
                  type="button"
                  onClick={() => conflicts.forEach((c) => onResolve(c.id, { choice: ResolutionChoice.KEEP_SERVER }))}
                  className="px-2 py-1 text-xs rounded font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Keep All Server
                </button>
              </div>

              {conflicts.map((conflict, index) => (
                <ConflictItem key={conflict.id} conflict={conflict} resolution={resolutions[conflict.id]} onResolve={onResolve} index={index} />
              ))}
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Merge Preview</h3>
              {mergePreview ? (
                <div className="space-y-4">
                  <div className="flex gap-4 text-sm" aria-live="polite">
                    <span className="text-green-700">✓ {mergePreview.resolved?.length || 0} auto-resolved</span>
                    <span className="text-yellow-700">⚠ {mergePreview.conflicts?.length || 0} remaining</span>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Merged Board State</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">Columns:</span> {Object.keys(mergePreview.merged?.board?.columns || {}).length}</div>
                      <div><span className="text-gray-600">Cards:</span> {Object.keys(mergePreview.merged?.board?.cards || {}).length}</div>
                      <div><span className="text-gray-600">Version:</span> {mergePreview.merged?.version}</div>
                    </div>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Column Order</div>
                    <div className="flex flex-wrap gap-2">
                      {mergePreview.merged?.board?.columnOrder?.map((colId) => (
                        <span key={colId} className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {mergePreview.merged.board.columns[colId]?.title || colId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Unable to generate preview</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onDismiss} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded">
            Use Server Version
          </button>
          <div className="flex gap-2 items-center">
            {!allResolved && <span className="text-sm text-yellow-700 mr-2" role="status">Resolve all conflicts to apply</span>}
            <button
              type="button"
              onClick={() => {
                if (mergePreview?.merged) {
                  onApplyMerge(mergePreview.merged)
                }
              }}
              disabled={!allResolved}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${allResolved ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              aria-disabled={!allResolved}
            >
              Apply Merged Changes
            </button>
          </div>
        </div>

        <p className="sr-only">Press Escape to use server version and close this dialog.</p>
      </div>
    </div>
  )
}

ConflictResolutionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  conflicts: PropTypes.array.isRequired,
  localState: PropTypes.object,
  serverState: PropTypes.object,
  baseState: PropTypes.object,
  resolutions: PropTypes.object.isRequired,
  onResolve: PropTypes.func.isRequired,
  onApplyMerge: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
}

export default ConflictResolutionModal
