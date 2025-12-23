/**
 * MSW Browser Worker Setup
 *
 * Initializes Mock Service Worker for browser environments.
 * This intercepts fetch requests and returns mock responses.
 */

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Create the worker instance
export const worker = setupWorker(...handlers)
