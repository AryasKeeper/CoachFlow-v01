/**
 * Database utilities and optimized queries
 */

export * from './query-optimizer'
export * from './safe-query'
export * from './json-helpers'

// Re-export commonly used utilities
export {
  queryOptimizer,
  useDatabaseMetrics
} from './query-optimizer'

export {
  safeQuery,
  ensureJsonArray,
  ensureJsonObject
} from './safe-query'

export {
  parseAvailability,
  parseListingDates,
  parseTimeIntervals,
  parseStringArray,
  parseFacilityFeatures,
  toJsonArray,
  toJsonObject
} from './json-helpers'

export type { QueryMetrics } from './query-optimizer'
export type { SafeQueryResult } from './safe-query'
export type {
  AvailabilityData,
  ListingDate,
  TimeInterval
} from './json-helpers'