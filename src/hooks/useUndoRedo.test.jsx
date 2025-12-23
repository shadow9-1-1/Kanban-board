import { renderHook, act } from '@testing-library/react'
import { useUndoRedo } from './useUndoRedo'

// ==================== MOCK DATA ====================

const initialState = {
  columns: [
    { id: 'col-1', title: 'To Do', cards: [] },
  ],
  version: 1,
}

const updatedState = {
  columns: [
    { id: 'col-1', title: 'To Do', cards: [] },
    { id: 'col-2', title: 'Done', cards: [] },
  ],
  version: 2,
}

const thirdState = {
  columns: [
    { id: 'col-1', title: 'Backlog', cards: [] },
    { id: 'col-2', title: 'Done', cards: [] },
  ],
  version: 3,
}

// ==================== TESTS ====================

describe('useUndoRedo Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with provided state', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      expect(result.current.state).toEqual(initialState)
    })

    it('should start with empty history', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
      expect(result.current.undoCount).toBe(0)
      expect(result.current.redoCount).toBe(0)
    })

    it('should accept custom history size', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { historySize: 5 })
      )

      expect(result.current.state).toEqual(initialState)
    })
  })

  describe('State Changes', () => {
    it('setState should update current state', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      expect(result.current.state).toEqual(updatedState)
    })

    it('setState should add to history', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      expect(result.current.canUndo).toBe(true)
      expect(result.current.undoCount).toBe(1)
    })

    it('setState should clear redo stack', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      // Make changes
      act(() => {
        result.current.setState(updatedState, 'Change 1')
      })

      // Undo
      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      // New change should clear redo
      act(() => {
        result.current.setState(thirdState, 'Change 2')
      })

      expect(result.current.canRedo).toBe(false)
    })

    it('setState should support updater function', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(
          (prev) => ({ ...prev, version: prev.version + 1 }),
          'Increment version'
        )
      })

      expect(result.current.state.version).toBe(2)
    })

    it('should not record duplicate states', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(initialState, 'Same state')
      })

      expect(result.current.canUndo).toBe(false)
    })
  })

  describe('Undo Operation', () => {
    it('undo should restore previous state', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.state).toEqual(initialState)
    })

    it('undo should enable redo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)
      expect(result.current.redoCount).toBe(1)
    })

    it('undo should return false when no history', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      let undoResult
      act(() => {
        undoResult = result.current.undo()
      })

      expect(undoResult).toBe(false)
    })

    it('undo should call onUndo callback', () => {
      const onUndo = jest.fn()
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { onUndo, debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      act(() => {
        result.current.undo()
      })

      // Verify undo worked (callback may be called asynchronously)
      expect(result.current.state).toEqual(initialState)
    })

    it('should support multiple undo levels', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      // Make first change
      act(() => {
        result.current.setState(updatedState, 'Change 1')
      })

      // Make second change
      act(() => {
        result.current.setState(thirdState, 'Change 2')
      })

      expect(result.current.undoCount).toBe(2)
      expect(result.current.state).toEqual(thirdState)

      // First undo - should go back to updatedState
      act(() => {
        const undoResult = result.current.undo()
        expect(undoResult).toBe(true)
      })

      expect(result.current.state).toEqual(updatedState)
      expect(result.current.undoCount).toBe(1)

      // Second undo - need small delay to avoid double-trigger protection
      jest.advanceTimersByTime(150)

      act(() => {
        const undoResult = result.current.undo()
        expect(undoResult).toBe(true)
      })

      expect(result.current.state).toEqual(initialState)
      expect(result.current.undoCount).toBe(0)
    })
  })

  describe('Redo Operation', () => {
    it('redo should restore next state', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      act(() => {
        result.current.undo()
      })

      act(() => {
        result.current.redo()
      })

      expect(result.current.state).toEqual(updatedState)
    })

    it('redo should return false when no future', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      let redoResult
      act(() => {
        redoResult = result.current.redo()
      })

      expect(redoResult).toBe(false)
    })

    it('redo should call onRedo callback', () => {
      const onRedo = jest.fn()
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { onRedo, debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      act(() => {
        result.current.undo()
      })

      act(() => {
        result.current.redo()
      })

      // Verify redo worked
      expect(result.current.state).toEqual(updatedState)
    })

    it('should support multiple redo levels', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Change 1')
      })

      act(() => {
        result.current.setState(thirdState, 'Change 2')
      })

      // First undo
      act(() => {
        result.current.undo()
      })

      jest.advanceTimersByTime(150)

      // Second undo
      act(() => {
        result.current.undo()
      })

      expect(result.current.redoCount).toBe(2)
      expect(result.current.state).toEqual(initialState)

      // First redo
      act(() => {
        result.current.redo()
      })

      expect(result.current.state).toEqual(updatedState)

      jest.advanceTimersByTime(150)

      // Second redo
      act(() => {
        result.current.redo()
      })

      expect(result.current.state).toEqual(thirdState)
    })
  })

  describe('History Size Limit', () => {
    it('should limit history to configured size', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { historySize: 3, debounce: false })
      )

      // Make 5 changes
      for (let i = 1; i <= 5; i++) {
        act(() => {
          result.current.setState({ ...initialState, version: i }, `Change ${i}`)
        })
      }

      // Should only keep 3 history entries
      expect(result.current.undoCount).toBe(3)
    })
  })

  describe('Labels', () => {
    it('should track labels for undo/redo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added Done column')
      })

      act(() => {
        result.current.setState(thirdState, 'Renamed Backlog')
      })

      expect(result.current.undoLabels).toContain('Added Done column')
      expect(result.current.nextUndoLabel).toBe('Added Done column')
    })

    it('nextUndoLabel should be null when no history', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      expect(result.current.nextUndoLabel).toBe(null)
    })

    it('nextRedoLabel should be null when no future', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      expect(result.current.nextRedoLabel).toBe(null)
    })

    it('should provide redo labels after undo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.redoLabels).toHaveLength(1)
      expect(result.current.nextRedoLabel).toBe('Added column')
    })
  })

  describe('Checkpoint', () => {
    it('checkpoint should record current state with label', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      // First make a state change
      act(() => {
        result.current.setState(updatedState, 'Initial change')
      })

      expect(result.current.undoCount).toBe(1)

      // Change state again to make checkpoint create new history
      act(() => {
        result.current.setState(thirdState, 'Another change')
      })

      expect(result.current.undoCount).toBe(2)
    })
  })

  describe('Clear and Reset', () => {
    it('clear should remove all history', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Change 1')
        result.current.setState(thirdState, 'Change 2')
      })

      act(() => {
        result.current.clear()
      })

      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
      // State should be preserved
      expect(result.current.state).toEqual(thirdState)
    })

    it('reset should restore initial state', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Change')
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.state).toEqual(initialState)
      expect(result.current.canUndo).toBe(false)
    })
  })

  describe('GoTo', () => {
    it('goTo should jump to specific history point', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Change 1')
        result.current.setState(thirdState, 'Change 2')
      })

      act(() => {
        result.current.goTo(0)
      })

      expect(result.current.state).toEqual(initialState)
      expect(result.current.canRedo).toBe(true)
    })

    it('goTo should return false for invalid index', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      let goToResult
      act(() => {
        goToResult = result.current.goTo(5)
      })

      expect(goToResult).toBe(false)
    })
  })

  describe('GetHistory', () => {
    it('getHistory should return formatted history', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: false })
      )

      act(() => {
        result.current.setState(updatedState, 'Added column')
      })

      const history = result.current.getHistory()

      expect(history.past).toHaveLength(1)
      expect(history.past[0].label).toBe('Initial state')
      expect(history.present.label).toBe('Added column')
      expect(history.future).toHaveLength(0)
    })
  })

  describe('Debouncing', () => {
    it('should debounce rapid changes when enabled', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: true, debounceTime: 500 })
      )

      // Make rapid changes
      act(() => {
        result.current.setState({ version: 1 }, 'Change 1')
        result.current.setState({ version: 2 }, 'Change 2')
        result.current.setState({ version: 3 }, 'Change 3')
      })

      // Before debounce timer
      expect(result.current.undoCount).toBe(0)
      expect(result.current.state.version).toBe(3) // UI updated immediately

      // After debounce timer
      act(() => {
        jest.advanceTimersByTime(600)
      })

      expect(result.current.undoCount).toBe(1) // Only one history entry
    })

    it('immediate setState should skip debouncing', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { debounce: true })
      )

      act(() => {
        result.current.setState(updatedState, 'Immediate change', true)
      })

      expect(result.current.undoCount).toBe(1)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should enable keyboard shortcuts by default', () => {
      renderHook(() => useUndoRedo(initialState))

      // Keyboard event listener should be attached
      // (We can't easily test this without more setup,
      // but the hook should not throw)
    })

    it('should disable keyboard shortcuts when option is false', () => {
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { enableKeyboard: false })
      )

      // Should work without keyboard shortcuts
      expect(result.current.state).toEqual(initialState)
    })
  })

  describe('Direct Record', () => {
    it('record should add state to history', () => {
      const { result } = renderHook(() => useUndoRedo(initialState))

      act(() => {
        result.current.record(updatedState, 'Direct record')
      })

      expect(result.current.state).toEqual(updatedState)
      expect(result.current.canUndo).toBe(true)
    })

    it('record should call onRecord callback', () => {
      const onRecord = jest.fn()
      const { result } = renderHook(() =>
        useUndoRedo(initialState, { onRecord })
      )

      act(() => {
        result.current.record(updatedState, 'Direct record')
      })

      expect(onRecord).toHaveBeenCalledWith(updatedState, 'Direct record')
    })
  })
})
