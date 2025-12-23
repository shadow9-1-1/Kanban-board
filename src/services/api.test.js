/**
 * API Service Tests
 * Tests for the HTTP client and API methods
 */

import { api, ApiError, isOnline, withOnlineCheck } from './api'

// Store original fetch
const originalFetch = global.fetch

describe('API Service', () => {
  let mockFetch

  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch
    jest.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('ApiError', () => {
    it('should create error with message and status', () => {
      const error = new ApiError('Not found', 404)
      
      expect(error.message).toBe('Not found')
      expect(error.status).toBe(404)
      expect(error.name).toBe('ApiError')
    })

    it('should include data when provided', () => {
      const error = new ApiError('Conflict', 409, { serverVersion: 5 })
      
      expect(error.data).toEqual({ serverVersion: 5 })
    })
  })

  describe('request helper', () => {
    it('should make successful request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const result = await api.getBoard()

      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should include content-type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.getBoard()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      })

      await expect(api.getBoard()).rejects.toThrow(ApiError)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(api.getBoard()).rejects.toThrow(ApiError)
    })

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const result = await api.getBoard()
      expect(result).toBeNull()
    })
  })

  describe('api.getBoard', () => {
    it('should fetch board from /api/board', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ columns: {}, version: 1 }),
      })

      await api.getBoard()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/board',
        expect.any(Object)
      )
    })
  })

  describe('api.saveBoard', () => {
    it('should PUT board data with version', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 2 }),
      })

      await api.saveBoard({ columns: {} }, 1)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/board',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ board: { columns: {} }, version: 1 }),
        })
      )
    })
  })

  describe('api.syncAction', () => {
    it('should POST action to /api/board/sync', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 2 }),
      })

      await api.syncAction({ type: 'ADD_CARD', payload: {} }, 1)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/board/sync',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should include response data on conflict', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ serverState: { version: 5 } }),
      })

      try {
        await api.syncAction({ type: 'ADD_CARD' }, 1)
      } catch (error) {
        expect(error.status).toBe(409)
        expect(error.response).toEqual({ serverState: { version: 5 } })
      }
    })
  })

  describe('api.submitMerge', () => {
    it('should POST merge to /api/board/merge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 3 }),
      })

      await api.submitMerge({ columns: {} }, 1, 2)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/board/merge',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            mergedBoard: { columns: {} },
            baseVersion: 1,
            serverVersion: 2,
          }),
        })
      )
    })
  })

  describe('Column Operations', () => {
    describe('api.addColumn', () => {
      it('should POST to /api/columns', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'col-1' }),
        })

        await api.addColumn('col-1', 'New Column', 1)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/columns',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ id: 'col-1', title: 'New Column', version: 1 }),
          })
        )
      })
    })

    describe('api.renameColumn', () => {
      it('should PATCH /api/columns/:id', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })

        await api.renameColumn('col-1', 'Renamed', 1)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/columns/col-1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ title: 'Renamed', version: 1 }),
          })
        )
      })
    })

    describe('api.archiveColumn', () => {
      it('should DELETE /api/columns/:id', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })

        await api.archiveColumn('col-1', 1)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/columns/col-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })
  })

  describe('Card Operations', () => {
    describe('api.addCard', () => {
      it('should POST card to column', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'card-1' }),
        })

        const card = { id: 'card-1', title: 'New Card' }
        await api.addCard('col-1', card, 1)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/columns/col-1/cards',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    describe('api.updateCard', () => {
      it('should PATCH card updates', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })

        await api.updateCard('card-1', { title: 'Updated' }, 1)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cards/card-1',
          expect.objectContaining({
            method: 'PATCH',
          })
        )
      })
    })

    describe('api.deleteCard', () => {
      it('should DELETE card', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })

        await api.deleteCard('card-1', 'col-1', 1)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cards/card-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })

    describe('api.moveCard', () => {
      it('should POST move to /api/cards/:id/move', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })

        await api.moveCard('card-1', 'col-1', 'col-2', 0, 1)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/cards/card-1/move',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              sourceColumnId: 'col-1',
              destColumnId: 'col-2',
              destIndex: 0,
              version: 1,
            }),
          })
        )
      })
    })
  })

  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })
      
      expect(isOnline()).toBe(true)

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })
      
      expect(isOnline()).toBe(false)
    })
  })

  describe('withOnlineCheck', () => {
    it('should call api function when online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      })

      const mockApiCall = jest.fn().mockResolvedValue({ success: true })
      const result = await withOnlineCheck(mockApiCall)

      expect(mockApiCall).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should throw ApiError when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      })

      const mockApiCall = jest.fn()

      await expect(withOnlineCheck(mockApiCall)).rejects.toThrow('You are offline')
      expect(mockApiCall).not.toHaveBeenCalled()
    })
  })
})
