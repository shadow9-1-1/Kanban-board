/**
 * Data Seeding Script for Performance Testing
 *
 * Generates a large dataset (500+ cards) to test Kanban board performance.
 *
 * USAGE:
 * 1. Import in browser console or component:
 *    import { generateLargeDataset, seedLocalStorage } from '../scripts/seedData.js'
 *
 * 2. From Node.js:
 *    node scripts/seedData.js > seed-output.json
 *
 * 3. Copy output to localStorage in browser dev tools:
 *    localStorage.setItem('kanban-board', JSON.stringify(data))
 *
 * CONFIGURATION:
 * - TOTAL_CARDS: Total number of cards to generate (default: 500)
 * - COLUMNS_CONFIG: Column distribution configuration
 * - Realistic titles, descriptions, and tags are randomly generated
 */

// Configuration
const TOTAL_CARDS = 500
const COLUMNS_CONFIG = [
  { id: 'col-backlog', title: 'Backlog', percentage: 0.3 }, // 30% of cards
  { id: 'col-todo', title: 'To Do', percentage: 0.25 }, // 25% of cards
  { id: 'col-in-progress', title: 'In Progress', percentage: 0.2 }, // 20% of cards
  { id: 'col-review', title: 'Review', percentage: 0.15 }, // 15% of cards
  { id: 'col-done', title: 'Done', percentage: 0.1 }, // 10% of cards
]

// Sample data for realistic card generation
const TASK_PREFIXES = [
  'Implement',
  'Fix',
  'Update',
  'Refactor',
  'Add',
  'Remove',
  'Create',
  'Design',
  'Test',
  'Review',
  'Optimize',
  'Debug',
  'Configure',
  'Deploy',
  'Document',
  'Research',
  'Integrate',
  'Migrate',
  'Upgrade',
  'Validate',
]

const TASK_SUBJECTS = [
  'user authentication',
  'payment gateway',
  'dashboard layout',
  'search functionality',
  'notification system',
  'API endpoint',
  'database schema',
  'caching layer',
  'error handling',
  'logging system',
  'unit tests',
  'integration tests',
  'CI/CD pipeline',
  'Docker configuration',
  'Kubernetes setup',
  'security headers',
  'rate limiting',
  'data validation',
  'form component',
  'modal dialog',
  'dropdown menu',
  'table pagination',
  'file upload',
  'image optimization',
  'lazy loading',
  'code splitting',
  'bundle size',
  'memory leak',
  'performance metrics',
  'accessibility',
  'responsive design',
  'dark mode',
  'localization',
  'analytics tracking',
  'A/B testing',
  'feature flag',
  'user preferences',
  'export functionality',
  'import wizard',
  'batch processing',
]

const DESCRIPTIONS = [
  'This task requires careful consideration of edge cases and error handling.',
  'Need to coordinate with the backend team for API changes.',
  'Should include unit tests and documentation updates.',
  'High priority - blocking other team members.',
  'Consider backward compatibility when implementing.',
  'Performance impact should be measured before and after.',
  'Follow the existing patterns in the codebase.',
  'Requires design review before implementation.',
  'This is part of the Q4 roadmap initiative.',
  'Technical debt that has been accumulating.',
  'Customer-reported issue that needs immediate attention.',
  'Part of the security audit recommendations.',
  'Improve developer experience and productivity.',
  'Reduce operational costs and complexity.',
  'Enable new features for enterprise customers.',
  '',
  '',
  '', // Empty descriptions for variety
]

const TAGS = ['urgent', 'feature', 'bug', 'design', 'tech-debt', 'backend', 'frontend', 'devops']

/**
 * Generate a simple UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get random item from array
 * @param {Array} arr - Source array
 * @returns {*} Random item
 */
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Get random subset of array
 * @param {Array} arr - Source array
 * @param {number} maxCount - Maximum items to return
 * @returns {Array} Random subset
 */
function randomSubset(arr, maxCount) {
  const count = Math.floor(Math.random() * (maxCount + 1))
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Generate a single card with realistic data
 * @param {number} index - Card index (for unique naming)
 * @returns {Object} Card object
 */
function generateCard(index) {
  const id = `card-${generateUUID()}`
  const title = `${randomItem(TASK_PREFIXES)} ${randomItem(TASK_SUBJECTS)}`
  const description = randomItem(DESCRIPTIONS)
  const tags = randomSubset(TAGS, 3)

  return {
    id,
    title: `${title} #${index + 1}`,
    description,
    tags,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

/**
 * Generate the complete board dataset
 * @param {number} totalCards - Total number of cards to generate
 * @param {Array} columnsConfig - Column configuration
 * @returns {Object} Board data { columns, columnOrder, cards }
 */
export function generateLargeDataset(totalCards = TOTAL_CARDS, columnsConfig = COLUMNS_CONFIG) {
  console.log(`\n🎲 Generating ${totalCards} cards across ${columnsConfig.length} columns...\n`)

  const columns = {}
  const columnOrder = []
  const cards = {}

  // Initialize columns
  columnsConfig.forEach((col) => {
    columns[col.id] = {
      id: col.id,
      title: col.title,
      cardIds: [],
    }
    columnOrder.push(col.id)
  })

  // Generate cards and distribute them
  let cardIndex = 0
  columnsConfig.forEach((col) => {
    const cardCount = Math.floor(totalCards * col.percentage)
    console.log(`  📋 ${col.title}: ${cardCount} cards`)

    for (let i = 0; i < cardCount; i++) {
      const card = generateCard(cardIndex)
      cards[card.id] = card
      columns[col.id].cardIds.push(card.id)
      cardIndex++
    }
  })

  // Add remaining cards to the first column
  const remaining = totalCards - cardIndex
  if (remaining > 0) {
    console.log(`  📋 Adding ${remaining} remaining cards to ${columnsConfig[0].title}`)
    for (let i = 0; i < remaining; i++) {
      const card = generateCard(cardIndex)
      cards[card.id] = card
      columns[columnsConfig[0].id].cardIds.push(card.id)
      cardIndex++
    }
  }

  console.log(`\n✅ Generated ${Object.keys(cards).length} total cards\n`)

  return {
    columns,
    columnOrder,
    cards,
  }
}

/**
 * Seed localStorage with generated data
 * @param {number} totalCards - Total number of cards
 * @returns {Object} Generated board data
 */
export function seedLocalStorage(totalCards = TOTAL_CARDS) {
  const boardData = generateLargeDataset(totalCards)

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('kanban-board', JSON.stringify(boardData))
    console.log('💾 Data saved to localStorage (key: "kanban-board")')
  } else {
    console.log('⚠️  localStorage not available (running in Node.js?)')
    console.log('📤 Use the returned data or pipe output to a file')
  }

  return boardData
}

/**
 * Generate dataset with custom distribution
 * @param {Object} options - Configuration options
 * @returns {Object} Board data
 */
export function generateCustomDataset(options = {}) {
  const {
    totalCards = 500,
    columnCount = 5,
    evenDistribution = false,
    customColumns = null,
  } = options

  let columnsConfig

  if (customColumns) {
    columnsConfig = customColumns
  } else if (evenDistribution) {
    // Even distribution across columns
    const percentage = 1 / columnCount
    columnsConfig = Array.from({ length: columnCount }, (_, i) => ({
      id: `col-${i + 1}`,
      title: `Column ${i + 1}`,
      percentage,
    }))
  } else {
    // Use default config
    columnsConfig = COLUMNS_CONFIG.slice(0, columnCount)
  }

  return generateLargeDataset(totalCards, columnsConfig)
}

/**
 * Performance stress test datasets
 */
export const STRESS_TEST_CONFIGS = {
  // Light load - normal usage
  light: { totalCards: 100, description: '100 cards - Normal usage' },

  // Medium load - busy board
  medium: { totalCards: 300, description: '300 cards - Busy board' },

  // Heavy load - stress test
  heavy: { totalCards: 500, description: '500 cards - Stress test' },

  // Extreme load - performance limit test
  extreme: { totalCards: 1000, description: '1000 cards - Extreme test' },

  // Single column stress - worst case for virtualization
  singleColumnStress: {
    totalCards: 500,
    customColumns: [{ id: 'col-all', title: 'All Cards', percentage: 1.0 }],
    description: '500 cards in single column - Virtualization stress test',
  },
}

/**
 * Run stress test with specific configuration
 * @param {string} configName - Name of stress test config
 * @returns {Object} Generated board data
 */
export function runStressTest(configName = 'heavy') {
  const config = STRESS_TEST_CONFIGS[configName]
  if (!config) {
    console.error(`Unknown config: ${configName}`)
    console.log('Available configs:', Object.keys(STRESS_TEST_CONFIGS).join(', '))
    return null
  }

  console.log(`\n🔥 Running stress test: ${config.description}\n`)
  return generateCustomDataset(config)
}

// CLI support - run directly with Node.js
const isRunningDirectly =
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  process.argv[1].includes('seedData')

if (isRunningDirectly) {
  const args = process.argv.slice(2)
  const configName = args[0] || 'heavy'
  const outputFormat = args[1] || 'json'

  const data = runStressTest(configName)

  if (data && outputFormat === 'json') {
    console.log(JSON.stringify(data, null, 2))
  }
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  window.seedKanban = {
    generateLargeDataset,
    seedLocalStorage,
    generateCustomDataset,
    runStressTest,
    STRESS_TEST_CONFIGS,
  }
  console.log('🎯 Kanban seeding utilities available at window.seedKanban')
  console.log('   Try: window.seedKanban.seedLocalStorage(500)')
}

export default {
  generateLargeDataset,
  seedLocalStorage,
  generateCustomDataset,
  runStressTest,
  STRESS_TEST_CONFIGS,
}
