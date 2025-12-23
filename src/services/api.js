/**
 * API Client Service
 *
 * HTTP client for communicating with the server.
 * Supports offline detection and version tracking for conflict resolution.
 *
 * OPTIMISTIC UI PATTERN:
 * =====================
 *
 * 1. User performs action (e.g., add card)
 * 2. UI updates immediately (optimistic)
 * 3. Action is queued for sync
 * 4. On sync success → confirm (no change needed)
 * 5. On sync failure → revert UI + show error
 *
 * VERSION TRACKING:
 * ================
 *
 * Each board state has a version number.
 * When syncing, we send our version.
 * Server responds with:
 * - 200: Success, new version
 * - 409: Conflict, server version is newer
 *
 * On conflict, we can:
 * - Fetch latest state and merge
 * - Or discard local changes
 */

const API_BASE_URL = '/api'
const REQUEST_TIMEOUT = 10000 // 10 seconds

/**
 * Custom error for API failures
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Make HTTP request with timeout and error handling
 *
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  // Create abort controller for timeout
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

    // Parse response
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(data?.message || `HTTP ${response.status}`, response.status, data)
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408)
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error - you may be offline', 0)
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error
    }

    // Wrap unknown errors
    throw new ApiError(error.message, 500)
  }
}

/**
 * API Client
 *
 * All methods return promises and throw ApiError on failure.
 */
export const api = {
  /**
   * Fetch entire board state from server
   * @returns {Promise<Object>} Board data with version
   */
  async getBoard() {
    return request('/board')
  },

  /**
   * Save entire board state to server
   * @param {Object} board - Board data
   * @param {number} version - Client's current version
   * @returns {Promise<Object>} { version, board }
   */
  async saveBoard(board, version) {
    return request('/board', {
      method: 'PUT',
      body: JSON.stringify({ board, version }),
    })
  },

  /**
   * Sync a single action with the server
   *
   * @param {Object} action - Action to sync { type, payload }
   * @param {number} version - Client's version at time of action
   * @returns {Promise<Object>} { version, result }
   */
  async syncAction(action, version) {
    return request('/board/sync', {
      method: 'POST',
      body: JSON.stringify({ action, version }),
    })
  },

  // ==================== COLUMN OPERATIONS ====================

  /**
   * Add a new column
   */
  async addColumn(id, title, version) {
    return request('/columns', {
      method: 'POST',
      body: JSON.stringify({ id, title, version }),
    })
  },

  /**
   * Rename a column
   */
  async renameColumn(columnId, title, version) {
    return request(`/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, version }),
    })
  },

  /**
   * Archive (delete) a column
   */
  async archiveColumn(columnId, version) {
    return request(`/columns/${columnId}`, {
      method: 'DELETE',
      body: JSON.stringify({ version }),
    })
  },

  // ==================== CARD OPERATIONS ====================

  /**
   * Add a new card to a column
   */
  async addCard(columnId, card, version) {
    return request(`/columns/${columnId}/cards`, {
      method: 'POST',
      body: JSON.stringify({ card, version }),
    })
  },

  /**
   * Update a card
   */
  async updateCard(cardId, updates, version) {
    return request(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({ updates, version }),
    })
  },

  /**
   * Delete a card
   */
  async deleteCard(cardId, columnId, version) {
    return request(`/cards/${cardId}`, {
      method: 'DELETE',
      body: JSON.stringify({ columnId, version }),
    })
  },

  /**
   * Move a card (within or between columns)
   */
  async moveCard(cardId, sourceColumnId, destColumnId, destIndex, version) {
    return request(`/cards/${cardId}/move`, {
      method: 'POST',
      body: JSON.stringify({
        sourceColumnId,
        destColumnId,
        destIndex,
        version,
      }),
    })
  },
}

/**
 * Check if browser is online
 * @returns {boolean}
 */
export const isOnline = () => {
  return navigator.onLine
}

/**
 * Utility to wrap API calls with online check
 *
 * @param {Function} apiCall - API function to call
 * @returns {Promise<Object>} API response or throws if offline
 */
export async function withOnlineCheck(apiCall) {
  if (!isOnline()) {
    throw new ApiError('You are offline', 0)
  }
  return apiCall()
}
