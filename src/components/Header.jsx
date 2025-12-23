/**
 * Header Component
 *
 * Displays the application title, branding, and optional children (e.g., SyncStatus).
 * Fixed at the top of the viewport.
 *
 * STYLING EXPLANATION:
 * - bg-gradient-to-r: Creates horizontal gradient (left to right)
 * - shadow-lg: Large drop shadow for depth
 * - sticky top-0: Sticks to top when scrolling
 * - z-50: High z-index to stay above other content
 */

import PropTypes from 'prop-types'

function Header({ children }) {
  return (
    <header
      className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg"
      data-testid="header"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          </div>

          {/* Right side content (e.g., SyncStatus) */}
          {children && (
            <div className="rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">{children}</div>
          )}
        </div>
      </div>
    </header>
  )
}

Header.propTypes = {
  children: PropTypes.node,
}

Header.defaultProps = {
  children: null,
}

export default Header
