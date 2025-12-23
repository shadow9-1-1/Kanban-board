# Accessibility Guide

This document outlines the accessibility features implemented in the Kanban Board application to ensure WCAG 2.1 AA compliance.

## Table of Contents

- [Overview](#overview)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Focus Management](#focus-management)
- [Color Contrast](#color-contrast)
- [Reduced Motion](#reduced-motion)
- [Testing Guide](#testing-guide)
- [Accessibility Checklist](#accessibility-checklist)

---

## Overview

The Kanban Board implements comprehensive accessibility features following WCAG 2.1 AA guidelines:

| Feature | Implementation | Status |
|---------|---------------|--------|
| Keyboard Navigation | Full keyboard support for all actions | ✅ |
| Focus Trap | Modals trap focus within boundaries | ✅ |
| ARIA Attributes | Proper roles, labels, and states | ✅ |
| Color Contrast | 4.5:1 minimum ratio for text | ✅ |
| Screen Reader | Live regions and announcements | ✅ |
| Reduced Motion | Respects `prefers-reduced-motion` | ✅ |

---

## Keyboard Navigation

### Global Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Escape` | Close open modal/dialog |
| `Enter` / `Space` | Activate focused button/link |

### Card Interactions

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open card detail modal |
| `Tab` | Navigate between cards |

### Modal Interactions

| Key | Action |
|-----|--------|
| `Tab` | Cycle through modal elements (trapped) |
| `Escape` | Close modal without saving |
| `Ctrl + Enter` | Save and close (in CardDetailModal) |

### Button Groups (Conflict Resolution)

| Key | Action |
|-----|--------|
| `Tab` | Move between button groups |
| `Enter` / `Space` | Activate resolution option |

---

## Screen Reader Support

### ARIA Roles

The application uses semantic ARIA roles:

```jsx
// Modal dialogs
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

// Alert dialogs (confirmations)
<div role="alertdialog" aria-modal="true">

// Cards as interactive buttons
<div role="button" tabIndex={0}>

// Form groups
<div role="group" aria-label="Resolution options">
```

### ARIA Labels

All interactive elements have descriptive labels:

```jsx
// Buttons with clear purpose
<button aria-label="Save card changes">Save</button>

// Form inputs with labels
<label htmlFor="card-title">Title</label>
<input id="card-title" aria-describedby="title-hint" />

// Toggle buttons with state
<button aria-pressed={isActive}>Toggle View</button>
```

### Live Regions

Dynamic content updates are announced:

```jsx
// Status changes
<div aria-live="polite">Syncing changes...</div>

// Error messages
<div role="alert" aria-live="assertive">Error: Failed to save</div>

// Progress updates
<div aria-live="polite">{resolvedCount} of {total} resolved</div>
```

### Screen Reader Only Content

Visually hidden but announced content:

```jsx
// Using the VisuallyHidden component
<VisuallyHidden>Card details for: {cardTitle}</VisuallyHidden>

// CSS class approach
<span className="sr-only">Press Escape to close</span>
```

---

## Focus Management

### Focus Trap (Modals)

Modals implement focus trapping using `useFocusTrap` hook:

```jsx
import { useFocusTrap } from '../hooks/useAccessibility'

function Modal({ isOpen, onClose }) {
  const { containerRef } = useFocusTrap({
    isActive: isOpen,
    onEscape: onClose,
    autoFocus: true,
    restoreFocus: true
  })

  return (
    <div ref={containerRef}>
      {/* Tab cycles only within this container */}
    </div>
  )
}
```

**Features:**
- Tab key cycles through focusable elements within the modal
- Shift+Tab cycles in reverse
- Escape key closes the modal
- Focus returns to trigger element on close
- First focusable element receives focus on open

### Focus Indicators

All interactive elements have visible focus indicators:

```css
/* Focus ring styles */
.focus:ring-2.focus:ring-blue-500.focus:ring-offset-2 {
  outline: none;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #3b82f6;
}
```

### Focus Restoration

When modals close, focus returns to the triggering element:

```jsx
// useFocusTrap handles this automatically
const { containerRef } = useFocusTrap({
  isActive: isOpen,
  restoreFocus: true  // Focus returns to trigger
})
```

---

## Color Contrast

### Text Contrast Ratios

The application maintains WCAG AA minimum contrast ratios:

| Element | Color | Background | Ratio |
|---------|-------|------------|-------|
| Body text | `gray-900` | white | 16:1 |
| Secondary text | `gray-700` | white | 8.59:1 |
| Placeholder | `gray-600` | white | 5.74:1 |
| Error text | `red-600` | white | 4.8:1 |
| Success text | `green-700` | white | 5.4:1 |

### Color Usage

Colors are not the sole indicator of meaning:

```jsx
// ✅ Good: Icon + text + color
<span className="text-red-600">
  ⚠️ Error: {message}
</span>

// ✅ Good: Status with multiple indicators  
<span className="text-green-600">
  ✓ Resolved  {/* checkmark + text + color */}
</span>
```

---

## Reduced Motion

The application respects `prefers-reduced-motion`:

```jsx
import { useReducedMotion } from '../hooks/useAccessibility'

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion()
  
  return (
    <div className={prefersReducedMotion ? '' : 'animate-slide-in'}>
      Content
    </div>
  )
}
```

CSS respects the preference:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Guide

### Automated Testing

#### Using axe-core (Recommended)

Install and configure axe-core for automated accessibility testing:

```bash
npm install @axe-core/react --save-dev
```

Add to your test setup:

```jsx
// src/setupTests.js
import { configureAxe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

const axe = configureAxe({
  rules: {
    // Customize rules as needed
    'color-contrast': { enabled: true },
    'region': { enabled: false } // If using landmarks differently
  }
})
```

Write accessibility tests:

```jsx
// Component.test.jsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import CardDetailModal from './CardDetailModal'

test('CardDetailModal has no accessibility violations', async () => {
  const { container } = render(
    <CardDetailModal isOpen={true} card={mockCard} onClose={() => {}} />
  )
  
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

Run with:

```bash
npm test -- --testPathPattern="a11y"
```

#### Using Lighthouse

Run Lighthouse accessibility audits:

1. **Chrome DevTools:**
   - Open DevTools (F12)
   - Go to "Lighthouse" tab
   - Check "Accessibility" category
   - Click "Analyze page load"

2. **Command Line:**
   ```bash
   npx lighthouse http://localhost:5173 --only-categories=accessibility --output=html
   ```

3. **CI Integration:**
   ```yaml
   # .github/workflows/a11y.yml
   - name: Run Lighthouse
     uses: treosh/lighthouse-ci-action@v10
     with:
       urls: |
         http://localhost:5173
       budgetPath: ./lighthouse-budget.json
   ```

### Manual Testing

#### Keyboard-Only Navigation

1. Unplug your mouse or disable trackpad
2. Navigate the entire application using only keyboard
3. Verify all actions are accessible
4. Check that focus is always visible
5. Ensure Tab order is logical

**Test Checklist:**
- [ ] Can reach all interactive elements with Tab
- [ ] Can activate buttons with Enter/Space
- [ ] Can open cards with Enter/Space
- [ ] Can close modals with Escape
- [ ] Focus ring is visible on all elements
- [ ] Tab order follows visual order

#### Screen Reader Testing

Test with popular screen readers:

| Screen Reader | OS | Browser |
|--------------|-----|---------|
| NVDA (free) | Windows | Chrome/Firefox |
| JAWS | Windows | Chrome/IE |
| VoiceOver | macOS/iOS | Safari |
| TalkBack | Android | Chrome |

**NVDA Quick Start:**
1. Download from [nvaccess.org](https://www.nvaccess.org/)
2. Start NVDA
3. Navigate with Tab, Arrow keys
4. Verify announcements are meaningful

**VoiceOver (macOS):**
1. Press `Cmd + F5` to enable
2. Use `Control + Option + Arrow` to navigate
3. Check rotor (`Control + Option + U`) for headings

#### Color Contrast Testing

Use these tools:

1. **Browser Extensions:**
   - [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools)
   - [WAVE](https://wave.webaim.org/extension/)

2. **Online Tools:**
   - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

3. **Chrome DevTools:**
   - Inspect element → Styles → View contrast ratio

---

## Accessibility Checklist

### Before Each Release

- [ ] **Keyboard Navigation**
  - [ ] All actions possible without mouse
  - [ ] Tab order is logical
  - [ ] Focus indicators visible
  - [ ] No keyboard traps (except intentional modal traps)
  
- [ ] **Screen Reader**
  - [ ] All images have alt text or aria-hidden
  - [ ] Form inputs have labels
  - [ ] Buttons have descriptive text
  - [ ] Dynamic content uses aria-live
  - [ ] Modal titles linked with aria-labelledby
  
- [ ] **Visual**
  - [ ] Text contrast ≥ 4.5:1
  - [ ] Large text contrast ≥ 3:1
  - [ ] Focus visible on all elements
  - [ ] Color not sole indicator
  - [ ] Text resizable to 200%
  
- [ ] **Motor**
  - [ ] Click targets ≥ 44x44px
  - [ ] Adequate spacing between targets
  - [ ] No time limits (or adjustable)
  
- [ ] **Cognitive**
  - [ ] Clear error messages
  - [ ] Consistent navigation
  - [ ] Predictable behavior

### Automated Tests

```bash
# Run full accessibility test suite
npm run test:a11y

# Run Lighthouse audit
npm run lighthouse

# Check specific component
npm test -- CardDetailModal.a11y.test.jsx
```

---

## Custom Accessibility Hooks

The application provides reusable accessibility utilities in `src/hooks/useAccessibility.js`:

### useFocusTrap

Traps focus within a container (for modals):

```jsx
const { containerRef } = useFocusTrap({
  isActive: true,
  onEscape: handleClose,
  autoFocus: true,
  restoreFocus: true
})
```

### useArrowNavigation

Handles arrow key navigation in lists:

```jsx
const { handleKeyDown, setIndex } = useArrowNavigation({
  itemCount: items.length,
  currentIndex,
  onIndexChange: setCurrentIndex
})
```

### useAnnounce

Makes announcements to screen readers:

```jsx
const { announce, Announcer } = useAnnounce()

// In component
announce('Card saved successfully')

// In JSX
return (
  <>
    <Announcer />
    {/* rest of UI */}
  </>
)
```

### useReducedMotion

Detects user's motion preference:

```jsx
const prefersReducedMotion = useReducedMotion()
```

### VisuallyHidden Component

Hides content visually but keeps it for screen readers:

```jsx
<VisuallyHidden>Additional context for screen readers</VisuallyHidden>
```

### SkipLink Component

Provides skip navigation links:

```jsx
<SkipLink targetId="main-content">Skip to main content</SkipLink>
```

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
