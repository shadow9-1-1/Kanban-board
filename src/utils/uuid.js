// UUID Utility - Provides stable unique identifiers for cards and columns
import { v4 as uuidv4 } from 'uuid'

// Generate a new UUID v4
export const generateId = () => uuidv4()

// Create initial board data with stable IDs
export const createInitialData = () => {
  const todoId = generateId()
  const inProgressId = generateId()
  const doneId = generateId()

  return {
    columns: {
      [todoId]: { id: todoId, title: 'To Do', cardIds: [] },
      [inProgressId]: { id: inProgressId, title: 'In Progress', cardIds: [] },
      [doneId]: { id: doneId, title: 'Done', cardIds: [] },
    },
    columnOrder: [todoId, inProgressId, doneId],
    cards: {},
  }
}
