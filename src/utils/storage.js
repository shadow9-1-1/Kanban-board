// Local Storage Utility - Handles persisting board data to localStorage
const DEFAULT_STORAGE_KEY = 'kanban-board-data'

// Save data to localStorage
export const saveToStorage = (key, data) => {
  if (data === undefined) {
    data = key
    key = DEFAULT_STORAGE_KEY
  }
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// Load data from localStorage
export const loadFromStorage = (key = DEFAULT_STORAGE_KEY) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return null
  }
}

// Clear data from localStorage
export const clearStorage = (key = DEFAULT_STORAGE_KEY) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}
