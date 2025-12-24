# Kanban Board

A feature-rich Kanban board application built with React, featuring drag-and-drop functionality, offline support, conflict resolution, and comprehensive accessibility.

## Project Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Kanban-board

# Install dependencies
npm install
```

### Running the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application runs at `http://localhost:5173` (or next available port).

### Environment

The app uses Mock Service Worker (MSW) to simulate a backend API in development. No additional backend setup is required.

---

## Testing

### Unit Tests

Unit tests cover individual components, hooks, reducers, and utility functions using Jest and React Testing Library.

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Integration Tests

Integration tests verify interactions between multiple components and services.

```bash
# Run integration tests (included in npm test)
npm test -- --testPathPatterns="integration"

# Example: offline sync integration
npm test -- src/hooks/offlineSync.integration.test.jsx
```

### End-to-End Tests

E2E tests use Cypress to test complete user workflows in a real browser.

```bash
# Open Cypress interactive runner
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run

# Run specific e2e test
npx cypress run --spec "cypress/e2e/kanban.cy.js"
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

## Architecture Summary

This Kanban board application implements a layered architecture using React 18 with Context API and `useReducer` for state management. The architecture prioritizes separation of concerns, testability, and offline-first functionality.

**State Management Layer**: The application uses a split context pattern with `BoardStateContext` for read-only state and `BoardDispatchContext` for actions. This separation optimizes rendering performance by preventing unnecessary re-renders in components that only dispatch actions. The `boardReducer.js` handles all state transitions through a centralized reducer pattern, ensuring predictable state changes.

**Service Layer**: Business logic resides in the `services/` directory, decoupled from React components. The `syncQueue.js` implements a singleton queue manager for offline operations, persisting pending actions to localStorage. The `conflictResolver.js` provides three-way merge functionality, comparing base, local, and server states to detect and resolve concurrent edit conflicts.

**Component Architecture**: Components follow a presentational/container pattern. Smart components (`BoardProvider`, `SyncProvider`) manage state and side effects, while presentational components (`Card`, `ListColumn`, `Header`) focus on rendering. Modal components use `React.lazy()` for code splitting, reducing initial bundle size.

**Offline-First Design**: The `SyncProvider` monitors network status and manages background synchronization. Actions are applied optimistically to local state, then queued for server sync. Failed operations retry with exponential backoff, and version conflicts trigger the conflict resolution modal.

**Performance Optimizations**: Large card lists use virtualization via `react-window` when exceeding 30 items. Memoization with `useCallback` and `memo` prevents unnecessary re-renders. LocalStorage writes are debounced to avoid blocking the main thread.

**Accessibility**: The application implements WCAG 2.1 AA guidelines with focus trapping in modals, keyboard navigation for drag-and-drop, and screen reader announcements for dynamic content changes.

---

## Project Structure

```
src/
├── components/     # React UI components
├── context/        # State management (providers, reducers, actions)
├── hooks/          # Custom React hooks
├── services/       # Business logic (API, sync queue, conflict resolver)
├── utils/          # Utility functions
└── mocks/          # MSW mock handlers
```

## Tech Stack

- **Framework**: React 18 with Vite
- **State**: Context API + useReducer
- **Drag & Drop**: @dnd-kit
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library, Cypress
- **Mocking**: Mock Service Worker (MSW)

---

## Documentation

- [Testing Guide](docs/TESTING.md)
- [Accessibility Guide](docs/ACCESSIBILITY.md)
- [Performance Guide](docs/PERFORMANCE.md)
- [Project Essays](docs/PROJECT_ESSAYS.md)
