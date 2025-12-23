/**
 * Environment utilities
 * Abstracts environment detection for both Vite and Jest compatibility
 *
 * Vite uses import.meta.env which doesn't work in Jest.
 * This utility provides a Jest-compatible way to check environments.
 */

/* global process */

// Check if we're in development mode
// Uses process.env which works in both Vite (via define) and Jest
export const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'

// Check if we're in production mode
export const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'

// Check if we're in test mode
export const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
