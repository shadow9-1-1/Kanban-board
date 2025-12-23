// API Client Service - HTTP client for server communication
const API_BASE_URL = '/api'
const REQUEST_TIMEOUT = 10000

// Custom error for API failures
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Make HTTP request with timeout and error handling
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(data?.message || `HTTP ${response.status}`, response.status, data)
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408)
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error - you may be offline', 0)
    }

    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError(error.message, 500)
  }
}

// API Client with all endpoints
export const api = {
  // Fetch entire board state from server
  async getBoard() {
    return request('/board')
  },

  // Save entire board state to server
  async saveBoard(board, version) {
    return request('/board', {
      method: 'PUT',
      body: JSON.stringify({ board, version }),
    })
  },

  // Sync a single action with the server
  async syncAction(action, version) {
    try {
      return await request('/board/sync', {
        method: 'POST',
        body: JSON.stringify({ action, version }),
      })
    } catch (error) {
      if (error.status === 409 && error.data) {
        error.response = error.data
      }
      throw error
    }
  },

  // Submit a resolved merge to the server
  async submitMerge(mergedBoard, baseVersion, serverVersion) {
    return request('/board/merge', {
      method: 'POST',
      body: JSON.stringify({ mergedBoard, baseVersion, serverVersion }),
    })
  },

  // Add a new column
  async addColumn(id, title, version) {
    return request('/columns', {
      method: 'POST',
      body: JSON.stringify({ id, title, version }),
    })
  },

  // Rename a column
  async renameColumn(columnId, title, version) {
    return request(`/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, version }),
    })
  },

  // Archive (delete) a column
  async archiveColumn(columnId, version) {
    return request(`/columns/${columnId}`, {
      method: 'DELETE',
      body: JSON.stringify({ version }),
    })
  },

  // Add a new card to a column
  async addCard(columnId, card, version) {
    return request(`/columns/${columnId}/cards`, {
      method: 'POST',
      body: JSON.stringify({ card, version }),
    })
  },

  // Update a card
  async updateCard(cardId, updates, version) {
    return request(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ updates, version }),
    })
  },

  // Delete a card
  async deleteCard(cardId, columnId, version) {
    return request(`/cards/${cardId}`, {
      method: 'DELETE',
      body: JSON.stringify({ columnId, version }),
    })
  },

  // Move a card within or between columns
  async moveCard(cardId, sourceColumnId, destColumnId, destIndex, version) {
    return request(`/cards/${cardId}/move`, {
      method: 'POST',
      body: JSON.stringify({ sourceColumnId, destColumnId, destIndex, version }),
    })
  },
}

// Check if browser is online
export const isOnline = () => navigator.onLine

// Utility to wrap API calls with online check
export async function withOnlineCheck(apiCall) {
  if (!isOnline()) {
    throw new ApiError('You are offline', 0)
  }
  return apiCall()
}
