// MSW Browser Worker Setup - Initializes mock service worker for browser
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
