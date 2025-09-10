/**
 * Database utilities and optimized queries
 */

export * from './query-optimizer'

// Re-export commonly used utilities
export {
  queryOptimizer,
  useDatabaseMetrics
} from './query-optimizer'

export type { QueryMetrics } from './query-optimizer'