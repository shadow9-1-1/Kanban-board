/**
 * Board Context
 *
 * React Context for Kanban board state management.
 * Provides state and dispatch to all descendant components.
 *
 * USAGE:
 * 1. Wrap app with <BoardProvider>
 * 2. Access state/dispatch via useBoardContext() hook
 */

import { createContext } from 'react'

/**
 * BoardStateContext
 *
 * Contains the current state object.
 * Separated from dispatch context for performance optimization -
 * components that only need to dispatch don't re-render on state changes.
 */
export const BoardStateContext = createContext(null)
BoardStateContext.displayName = 'BoardStateContext'

/**
 * BoardDispatchContext
 *
 * Contains the dispatch function.
 * Stable reference (doesn't change between renders).
 */
export const BoardDispatchContext = createContext(null)
BoardDispatchContext.displayName = 'BoardDispatchContext'
