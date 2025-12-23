// Header - Application title and branding
import PropTypes from 'prop-types'

function Header({ children }) {
  return (
    <header
      className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg"
      data-testid="header"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            
            <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          </div>
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
