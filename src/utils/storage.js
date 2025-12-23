/**
 * Local Storage Utility
 *
 * Handles persisting board data to localStorage.
 * This allows the Kanban board to maintain state across browser sessions.
 */

const STORAGE_KEY = 'kanban-board-data'

/**
 * Save board data to localStorage
 * @param {Object} data - The board state to persist
 */
export const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save to localStorage:', error)
  }
}

/**
 * Load board data from localStorage
 * @returns {Object|null} The saved board state or null if none exists
 */
export const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load from localStorage:', error)
    return null
  }
}

/**
 * Clear board data from localStorage
 */
export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear localStorage:', error)
  }
}
