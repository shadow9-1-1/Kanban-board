# Testing Guide

This document explains the testing strategy and how to run tests for the Kanban Board application.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Coverage Strategy](#coverage-strategy)
- [Writing Tests](#writing-tests)

---

## Overview

The application uses a multi-layer testing strategy:

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Tests | Jest + RTL | Test individual components and functions |
| Integration Tests | Jest | Test component interactions and hooks |
| E2E Tests | Cypress | Test complete user workflows |

### Test Files Organization

```
src/
├── components/
│   ├── Card.jsx
│   ├── Card.test.jsx           # Component unit tests
│   ├── Toolbar.jsx
│   ├── Toolbar.test.jsx
│   └── ListColumn.test.jsx
├── context/
│   ├── boardReducer.js
│   └── boardReducer.test.js    # Reducer unit tests
├── hooks/
│   ├── useOfflineSync.js
│   ├── useOfflineSync.test.jsx # Hook unit tests
│   └── offlineSync.integration.test.jsx # Integration tests
│   ├── useUndoRedo.js
│   └── useUndoRedo.test.jsx
└── App.test.jsx                # App smoke tests

cypress/
└── e2e/
    └── kanban.cy.js            # E2E tests
```

---

## Test Structure

### Unit Tests (Jest + RTL)

Unit tests focus on isolated functionality:

#### Component Tests
```jsx
// Card.test.jsx
describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render card title', () => { ... })
    it('should render tags', () => { ... })
  })
  
  describe('Interactions', () => {
    it('should call onCardClick when clicked', () => { ... })
  })
  
  describe('Accessibility', () => {
    it('should have role="button"', () => { ... })
  })
})
```

#### Reducer Tests
```js
// boardReducer.test.js
describe('boardReducer', () => {
  describe('COLUMN_ADD', () => {
    it('should add new column', () => { ... })
    it('should not mutate original state', () => { ... })
  })
  
  describe('CARD_MOVE', () => {
    it('should move within same column', () => { ... })
    it('should move to different column', () => { ... })
  })
})
```

### Integration Tests

Integration tests verify multiple units working together:

```jsx
// offlineSync.integration.test.jsx
describe('Offline Sync Integration', () => {
  it('should queue actions when offline', () => { ... })
  it('should sync when coming online', () => { ... })
  it('should handle conflicts', () => { ... })
})
```

### E2E Tests (Cypress)

E2E tests simulate real user workflows:

```js
// kanban.cy.js
describe('Complete User Journey', () => {
  it('should create lists, cards, go offline, and sync', () => {
    // 1. Create list
    cy.createColumn('Backlog')
    
    // 2. Create card
    cy.createCard('Backlog', 'Feature A')
    
    // 3. Go offline
    cy.goOffline()
    
    // 4. Make changes
    cy.createCard('Backlog', 'Offline Card')
    
    // 5. Go online
    cy.goOnline()
    
    // 6. Verify sync
    cy.contains('Offline Card').should('be.visible')
  })
})
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- Card.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="CARD_ADD"

# Watch mode (re-run on changes)
npm test -- --watch
```

### E2E Tests

```bash
# Start dev server first
npm run dev

# In another terminal, run Cypress
npm run cypress:open   # Interactive mode
npm run cypress:run    # Headless mode

# Run specific spec
npm run cypress:run -- --spec "cypress/e2e/kanban.cy.js"
```

### Coverage Report

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Coverage Strategy

### Target: 80% Coverage

The project targets 80% code coverage across all metrics:

| Metric | Target | Description |
|--------|--------|-------------|
| Statements | 80% | Individual statements executed |
| Branches | 80% | Conditional branches (if/else, ternary) |
| Functions | 80% | Functions called |
| Lines | 80% | Lines of code executed |

### Priority Areas for Coverage

1. **Critical Business Logic (100%)**
   - `boardReducer.js` - All state transitions
   - `syncQueue.js` - Offline sync logic
   - `conflictResolver.js` - Merge conflicts

2. **UI Components (80%+)**
   - Card interactions
   - Column operations
   - Modal behaviors

3. **Hooks (90%+)**
   - `useOfflineSync` - Sync state machine
   - `useUndoRedo` - History management
   - `useBoardState` - Selectors and actions

4. **Lower Priority (60%+)**
   - Utility functions
   - Simple presentational components

### Coverage Exclusions

Files excluded from coverage in `jest.config.js`:

```js
collectCoverageFrom: [
  'src/**/*.{js,jsx}',
  '!src/main.jsx',          // Entry point
  '!src/**/*.test.{js,jsx}', // Test files
  '!src/setupTests.js',      // Test setup
  '!src/mocks/**',           // MSW mocks
]
```

---

## Writing Tests

### Best Practices

1. **Arrange-Act-Assert Pattern**
   ```jsx
   it('should update card title', () => {
     // Arrange
     const state = createInitialState()
     const action = { type: 'CARD_UPDATE', payload: { ... } }
     
     // Act
     const newState = boardReducer(state, action)
     
     // Assert
     expect(newState.board.cards['id'].title).toBe('New Title')
   })
   ```

2. **Test Behavior, Not Implementation**
   ```jsx
   // ✅ Good: Test what user sees
   it('should display error message', () => {
     render(<Form />)
     fireEvent.submit(form)
     expect(screen.getByRole('alert')).toHaveTextContent('Required')
   })
   
   // ❌ Bad: Test internal state
   it('should set error state', () => {
     expect(component.state.error).toBe(true)
   })
   ```

3. **Use RTL Queries Properly**
   ```jsx
   // Priority (most to least preferred):
   // 1. getByRole - Most accessible
   screen.getByRole('button', { name: /submit/i })
   
   // 2. getByLabelText - Form inputs
   screen.getByLabelText('Email')
   
   // 3. getByText - Static text
   screen.getByText('Welcome')
   
   // 4. getByTestId - Last resort
   screen.getByTestId('card-123')
   ```

4. **Test Immutability in Reducers**
   ```js
   it('should not mutate original state', () => {
     const original = createInitialState()
     const originalColumns = { ...original.board.columns }
     
     boardReducer(original, action)
     
     expect(original.board.columns).toEqual(originalColumns)
   })
   ```

### Testing Async Operations

```jsx
// For async hooks
it('should sync when online', async () => {
  const { result } = renderHook(() => useOfflineSync())
  
  act(() => {
    result.current.enqueue(action)
  })
  
  await waitFor(() => {
    expect(mockApi).toHaveBeenCalled()
  })
})
```

### Testing User Interactions

```jsx
// Use userEvent for realistic interactions
import userEvent from '@testing-library/user-event'

it('should submit form', async () => {
  const user = userEvent.setup()
  render(<Form onSubmit={mockSubmit} />)
  
  await user.type(screen.getByLabelText('Name'), 'John')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(mockSubmit).toHaveBeenCalledWith({ name: 'John' })
})
```

### Mocking

```jsx
// Mock modules
jest.mock('../services/api', () => ({
  syncAction: jest.fn().mockResolvedValue({ success: true })
}))

// Mock localStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockStorage })

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: false,
  writable: true
})
```

---

## Test Commands Summary

```bash
# Unit tests
npm test                    # Run once
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage

# Specific tests
npm test -- Card            # Run Card tests
npm test -- reducer         # Run reducer tests

# E2E tests
npm run cypress:open        # Interactive
npm run cypress:run         # Headless

# Coverage
npm test -- --coverage --coverageReporters=text-summary
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npm test -- --coverage --ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- -t "should add column"

# Debug in VS Code
# Add to launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/jest/bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```
