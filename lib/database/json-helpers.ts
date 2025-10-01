/**
 * Type-safe helpers for accessing JSON fields from Supabase
 * Provides safe defaults to prevent undefined access errors
 */

import { Json } from '@/types/database'

// Type definitions for common JSON structures
export interface AvailabilityData {
  days?: string[]
  slots?: string[]
  minimum_notice?: string
  immediate?: boolean
  max_distance?: string
}

export interface ListingDate {
  start_date: string
  end_date?: string
}

export interface TimeInterval {
  id: string
  startTime: string
  endTime: string
}

/**
 * Safely parse availability JSON with defaults
 */
export function parseAvailability(json: Json | null | undefined): AvailabilityData {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return {
      days: [],
      slots: [],
      minimum_notice: '24 hours',
      immediate: false,
      max_distance: '25km'
    }
  }
  
  const data = json as Record<string, any>
  return {
    days: Array.isArray(data.days) ? data.days : [],
    slots: Array.isArray(data.slots) ? data.slots : [],
    minimum_notice: typeof data.minimum_notice === 'string' ? data.minimum_notice : '24 hours',
    immediate: typeof data.immediate === 'boolean' ? data.immediate : false,
    max_distance: typeof data.max_distance === 'string' ? data.max_distance : '25km'
  }
}

/**
 * Safely parse listing dates JSON with defaults
 */
export function parseListingDates(json: Json | null | undefined): ListingDate[] {
  if (!json) return []
  
  // Handle both array of dates and single date object
  if (Array.isArray(json)) {
    return json.map(item => {
      if (typeof item === 'object' && item !== null && 'start_date' in item) {
        return {
          start_date: String(item.start_date),
          end_date: item.end_date ? String(item.end_date) : undefined
        }
      }
      return { start_date: String(item) }
    })
  }
  
  if (typeof json === 'object' && json !== null && 'start_date' in json) {
    return [{
      start_date: String(json.start_date),
      end_date: json.end_date ? String(json.end_date) : undefined
    }]
  }
  
  return []
}

/**
 * Safely parse time intervals JSON with defaults
 */
export function parseTimeIntervals(json: Json | null | undefined): TimeInterval[] {
  if (!json || !Array.isArray(json)) return []
  
  return json
    .filter(item => typeof item === 'object' && item !== null)
    .map((item: any, index) => ({
      id: item.id || `interval-${index}`,
      startTime: item.startTime || item.start_time || '09:00',
      endTime: item.endTime || item.end_time || '17:00'
    }))
}

/**
 * Safely parse string array fields with defaults
 */
export function parseStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string')
  }
  return []
}

/**
 * Safely parse facility features
 */
export function parseFacilityFeatures(json: Json | null | undefined): string[] {
  return parseStringArray(json)
}

/**
 * Convert data back to JSON for database storage
 */
export function toJsonArray<T = any>(value: T[]): Json {
  return value as Json
}

export function toJsonObject<T = any>(value: T): Json {
  return value as Json
}
