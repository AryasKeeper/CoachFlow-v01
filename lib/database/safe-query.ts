/**
 * Safe query wrapper for Supabase queries with uniform error handling and logging
 */

import { databaseLogger } from '@/lib/monitoring'

export interface SafeQueryResult<T> {
  data: T | null
  error: Error | null
}

/**
 * Wraps a Supabase query with standard error handling and logging
 * Ensures consistent return type of { data, error }
 * 
 * @param queryFn - Async function that performs the query
 * @param queryName - Name of the query for logging purposes
 * @param context - Additional context for logging
 * @returns Promise<SafeQueryResult<T>>
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  queryName: string,
  context?: Record<string, unknown>
): Promise<SafeQueryResult<T>> {
  const startTime = Date.now()
  
  try {
    databaseLogger.debug(`[safeQuery] Executing: ${queryName}`, context)
    
    const result = await queryFn()
    const duration = Date.now() - startTime
    
    if (result.error) {
      databaseLogger.error(`[safeQuery] Query failed: ${queryName}`, {
        error: result.error,
        duration,
        ...context
      })
      
      // Convert Supabase error to standard Error
      const error = new Error(
        result.error.message || `Query ${queryName} failed`
      )
      
      return { data: null, error }
    }
    
    databaseLogger.debug(`[safeQuery] Query completed: ${queryName}`, {
      duration,
      dataType: result.data ? typeof result.data : 'null',
      ...context
    })
    
    return { data: result.data, error: null }
  } catch (error) {
    const duration = Date.now() - startTime
    
    databaseLogger.error(`[safeQuery] Exception in query: ${queryName}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      ...context
    })
    
    const errorObj = error instanceof Error 
      ? error 
      : new Error(`Unknown error in ${queryName}`)
    
    return { data: null, error: errorObj }
  }
}

/**
 * Helper to ensure JSON fields have safe defaults
 */
export function ensureJsonArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return []
  return []
}

/**
 * Helper to ensure JSON objects have safe defaults
 */
export function ensureJsonObject<T = Record<string, any>>(value: any): T {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as T
  }
  return {} as T
}

/**
 * Type guard for checking if a value is a valid JSON field
 */
export function isValidJson(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return true
  if (typeof value === 'number') return true
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.every(isValidJson)
  if (typeof value === 'object') {
    return Object.values(value).every(isValidJson)
  }
  return false
}
