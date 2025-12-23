import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isDev } from './utils/env'

// Clear localStorage if ?reset is in URL
if (window.location.search.includes('reset')) {
  localStorage.clear()
  window.location.href = window.location.pathname
}

async function enableMocking() {
  if (!isDev) return
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
