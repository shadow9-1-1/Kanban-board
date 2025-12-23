/**
 * UUID Utility
 *
 * Provides stable unique identifiers for cards and columns.
 * Using the uuid library ensures IDs persist across sessions
 * and don't collide even when created simultaneously.
 */

import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a new UUID v4
 * @returns {string} A unique identifier like "550e8400-e29b-41d4-a716-446655440000"
 */
export const generateId = () => uuidv4()

/**
 * Create initial board data with stable IDs
 * @returns {Object} Initial board state with columns and sample cards
 */
export const createInitialData = () => {
  const todoId = generateId()
  const inProgressId = generateId()
  const doneId = generateId()

  return {
    columns: {
      [todoId]: {
        id: todoId,
        title: 'To Do',
        cardIds: [],
      },
      [inProgressId]: {
        id: inProgressId,
        title: 'In Progress',
        cardIds: [],
      },
      [doneId]: {
        id: doneId,
        title: 'Done',
        cardIds: [],
      },
    },
    columnOrder: [todoId, inProgressId, doneId],
    cards: {},
  }
}
