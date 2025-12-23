// Accessibility Utility Hooks - Focus trap, arrow navigation, screen reader announcements
import { useEffect, useRef, useCallback, useState } from 'react'

// Focusable element selectors
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

// useFocusTrap - Traps keyboard focus within a container element
export function useFocusTrap({ isActive = true, onEscape, autoFocus = true, restoreFocus = true } = {}) {
  const containerRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (isActive && restoreFocus) {
      previousActiveElement.current = document.activeElement
    }

    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus?.()
      }
    }
  }, [isActive, restoreFocus])

  useEffect(() => {
    if (!isActive || !autoFocus || !containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
    const firstElement = focusableElements[0]

    if (firstElement) {
      requestAnimationFrame(() => {
        firstElement.focus()
      })
    }
  }, [isActive, autoFocus])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event) => {
      const container = containerRef.current
      if (!container) return

      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        event.stopPropagation()
        onEscape()
        return
      }

      if (event.key === 'Tab') {
        const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTORS)
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (!firstElement) return

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
          return
        }

        if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onEscape])

  return { containerRef }
}

// useArrowNavigation - Enables arrow key navigation through a list of items
export function useArrowNavigation({ itemCount, currentIndex, onIndexChange, horizontal = false, wrap = true } = {}) {
  const handleKeyDown = useCallback(
    (event) => {
      const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp'
      const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown'

      let newIndex = currentIndex

      if (event.key === prevKey) {
        event.preventDefault()
        newIndex = currentIndex - 1
        if (newIndex < 0) newIndex = wrap ? itemCount - 1 : 0
      } else if (event.key === nextKey) {
        event.preventDefault()
        newIndex = currentIndex + 1
        if (newIndex >= itemCount) newIndex = wrap ? 0 : itemCount - 1
      } else if (event.key === 'Home') {
        event.preventDefault()
        newIndex = 0
      } else if (event.key === 'End') {
        event.preventDefault()
        newIndex = itemCount - 1
      } else {
        return
      }

      if (newIndex !== currentIndex) onIndexChange(newIndex)
    },
    [currentIndex, itemCount, horizontal, wrap, onIndexChange]
  )

  const getItemProps = useCallback(
    (index) => ({
      tabIndex: index === currentIndex ? 0 : -1,
      'aria-selected': index === currentIndex,
      onKeyDown: handleKeyDown,
    }),
    [currentIndex, handleKeyDown]
  )

  return { handleKeyDown, getItemProps }
}

// useAnnounce - Provides screen reader announcements via ARIA live regions
export function useAnnounce() {
  const announcerRef = useRef(null)

  const announce = useCallback((message, priority = 'polite') => {
    if (!announcerRef.current) return
    announcerRef.current.textContent = ''
    announcerRef.current.setAttribute('aria-live', priority)
    requestAnimationFrame(() => {
      if (announcerRef.current) announcerRef.current.textContent = message
    })
  }, [])

  const Announcer = useCallback(
    () => (
      <div
        ref={announcerRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
    ),
    []
  )

  return { announce, Announcer }
}

// useReducedMotion - Detects if user prefers reduced motion
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event) => setPrefersReducedMotion(event.matches)

    mediaQuery.addEventListener?.('change', handleChange)
    return () => mediaQuery.removeEventListener?.('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// VisuallyHidden - Hides content visually while keeping it accessible
export function VisuallyHidden({ children, as: Component = 'span', ...props }) {
  return (
    <Component
      {...props}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  )
}

// SkipLink - Allows keyboard users to skip repetitive navigation
export function SkipLink({ href, children }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {children}
    </a>
  )
}

export default {
  useFocusTrap,
  useArrowNavigation,
  useAnnounce,
  useReducedMotion,
  VisuallyHidden,
  SkipLink,
}
