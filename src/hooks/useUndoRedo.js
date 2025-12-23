// useUndoRedo - Multi-level undo/redo with history management
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'

const DEFAULT_HISTORY_SIZE = 50
const DEBOUNCE_TIME = 500

// Deep clone an object
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  try { return JSON.parse(JSON.stringify(obj)) }
  catch { console.warn('useUndoRedo: Failed to clone state, using shallow copy'); return { ...obj } }
}

// Check if two states are equal
const statesEqual = (a, b) => {
  if (a === b) return true
  if (!a || !b) return false
  try { return JSON.stringify(a) === JSON.stringify(b) } catch { return false }
}

// Hook for undo/redo functionality
export const useUndoRedo = (initialState, options = {}) => {
  const { historySize = DEFAULT_HISTORY_SIZE, enableKeyboard = true, onUndo, onRedo, onRecord, debounce = true, debounceTime = DEBOUNCE_TIME } = options

  const [history, setHistory] = useState(() => ({
    past: [],
    present: { state: deepClone(initialState), label: 'Initial state', timestamp: Date.now() },
    future: [],
  }))

  const pendingUpdateRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const lastActionRef = useRef({ type: null, timestamp: 0 })
  const isMountedRef = useRef(true)

  const state = useMemo(() => history.present.state, [history.present.state])
  const canUndo = useMemo(() => history.past.length > 0, [history.past.length])
  const canRedo = useMemo(() => history.future.length > 0, [history.future.length])
  const undoCount = useMemo(() => history.past.length, [history.past.length])
  const redoCount = useMemo(() => history.future.length, [history.future.length])
  const undoLabels = useMemo(() => history.past.map((entry) => entry.label).reverse(), [history.past])
  const redoLabels = useMemo(() => history.future.map((entry) => entry.label), [history.future])
  const nextUndoLabel = useMemo(() => (history.past.length > 0 ? history.past[history.past.length - 1].label : null), [history.past])
  const nextRedoLabel = useMemo(() => (history.future.length > 0 ? history.future[0].label : null), [history.future])

  // Record a new state (push to history)
  const record = useCallback((newState, label = 'State change') => {
    if (statesEqual(newState, history.present.state)) return
    const entry = { state: deepClone(newState), label, timestamp: Date.now() }
    setHistory((prev) => {
      const newPast = [...prev.past, prev.present]
      if (newPast.length > historySize) newPast.shift()
      return { past: newPast, present: entry, future: [] }
    })
    if (onRecord) onRecord(newState, label)
  }, [history.present.state, historySize, onRecord])

  // Set state with optional debouncing
  const setState = useCallback((newStateOrUpdater, label = 'State change', immediate = false) => {
    const newState = typeof newStateOrUpdater === 'function' ? newStateOrUpdater(history.present.state) : newStateOrUpdater
    if (debounce && !immediate) {
      pendingUpdateRef.current = { state: newState, label }
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        if (pendingUpdateRef.current && isMountedRef.current) {
          record(pendingUpdateRef.current.state, pendingUpdateRef.current.label)
          pendingUpdateRef.current = null
        }
      }, debounceTime)
      setHistory((prev) => ({ ...prev, present: { ...prev.present, state: deepClone(newState) } }))
    } else {
      record(newState, label)
    }
  }, [debounce, debounceTime, history.present.state, record])

  // Undo last action
  const undo = useCallback(() => {
    if (!canUndo) return false
    const now = Date.now()
    if (lastActionRef.current.type === 'undo' && now - lastActionRef.current.timestamp < 100) return false
    lastActionRef.current = { type: 'undo', timestamp: now }
    if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); pendingUpdateRef.current = null }
    let prevState = null
    setHistory((prev) => {
      if (prev.past.length === 0) return prev
      const newPast = [...prev.past]
      const previousEntry = newPast.pop()
      prevState = previousEntry.state
      return { past: newPast, present: previousEntry, future: [prev.present, ...prev.future] }
    })
    if (onUndo && prevState) onUndo(prevState, history.present.state)
    return true
  }, [canUndo, onUndo, history.present.state])

  // Redo last undone action
  const redo = useCallback(() => {
    if (!canRedo) return false
    const now = Date.now()
    if (lastActionRef.current.type === 'redo' && now - lastActionRef.current.timestamp < 100) return false
    lastActionRef.current = { type: 'redo', timestamp: now }
    let nextState = null
    setHistory((prev) => {
      if (prev.future.length === 0) return prev
      const newFuture = [...prev.future]
      const nextEntry = newFuture.shift()
      nextState = nextEntry.state
      return { past: [...prev.past, prev.present], present: nextEntry, future: newFuture }
    })
    if (onRedo && nextState) onRedo(nextState, history.present.state)
    return true
  }, [canRedo, onRedo, history.present.state])

  // Create a checkpoint (named save point)
  const checkpoint = useCallback((label = 'Checkpoint') => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      if (pendingUpdateRef.current) { record(pendingUpdateRef.current.state, pendingUpdateRef.current.label); pendingUpdateRef.current = null }
    }
    record(history.present.state, `📍 ${label}`)
  }, [history.present.state, record])

  // Clear all history (keep current state)
  const clear = useCallback(() => {
    if (debounceTimerRef.current) { clearTimeout(debounceTimerRef.current); pendingUpdateRef.current = null }
    setHistory((prev) => ({ past: [], present: { ...prev.present, label: 'History cleared' }, future: [] }))
  }, [])

  // Reset to initial state
  const reset = useCallback(() => {
    setHistory({ past: [], present: { state: deepClone(initialState), label: 'Reset to initial state', timestamp: Date.now() }, future: [] })
  }, [initialState])

  // Go to a specific point in history
  const goTo = useCallback((index) => {
    if (index < 0 || index >= history.past.length) return false
    setHistory((prev) => {
      const targetEntry = prev.past[index]
      const newPast = prev.past.slice(0, index)
      const skippedPast = prev.past.slice(index + 1)
      const newFuture = [...skippedPast, prev.present, ...prev.future]
      return { past: newPast, present: targetEntry, future: newFuture }
    })
    return true
  }, [history.past.length])

  // Get full history for debugging/display
  const getHistory = useCallback(() => ({
    past: history.past.map((entry, idx) => ({ index: idx, label: entry.label, timestamp: entry.timestamp })),
    present: { label: history.present.label, timestamp: history.present.timestamp },
    future: history.future.map((entry, idx) => ({ index: idx, label: entry.label, timestamp: entry.timestamp })),
  }), [history])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    if (!enableKeyboard) return
    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      if (!isCtrlOrCmd) return
      const target = event.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (event.key === 'z' && !event.shiftKey) { event.preventDefault(); undo() }
      else if (event.key === 'z' && event.shiftKey) { event.preventDefault(); redo() }
      else if (event.key === 'y') { event.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboard, undo, redo])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false; if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [])

  return {
    state, setState, undo, redo, canUndo, canRedo,
    undoCount, redoCount, undoLabels, redoLabels, nextUndoLabel, nextRedoLabel,
    checkpoint, clear, reset, goTo, getHistory, record, history,
  }
}

export default useUndoRedo
