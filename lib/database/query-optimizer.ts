/**
 * Database query optimization utilities and monitoring
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { databaseLogger, performanceMonitor } from '@/lib/monitoring'

export interface QueryMetrics {
  query: string
  duration: number
  rowCount: number
  success: boolean
  timestamp: Date
}

export class QueryOptimizer {
  private static instance: QueryOptimizer
  private queryHistory: QueryMetrics[] = []

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer()
    }
    return QueryOptimizer.instance
  }

  // Enhanced query execution with monitoring
  async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<{ data: T | null; error: any; count?: number }>,
    context?: Record<string, unknown>
  ): Promise<{ data: T | null; error: any; count?: number }> {
    const startTime = Date.now()
    
    try {
      databaseLogger.debug(`Executing query: ${queryName}`, context)
      
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      // Record metrics
      const metrics: QueryMetrics = {
        query: queryName,
        duration,
        rowCount: result.count || (Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0),
        success: !result.error,
        timestamp: new Date()
      }
      
      this.recordQueryMetrics(metrics)
      
      // Log performance
      performanceMonitor.recordMetric(`db_query_${queryName}`, duration, 'ms', {
        rowCount: metrics.rowCount,
        success: metrics.success,
        ...context
      })
      
      if (result.error) {
        databaseLogger.error(`Query failed: ${queryName}`, {
          error: result.error,
          duration,
          ...context
        })
      } else {
        databaseLogger.debug(`Query completed: ${queryName}`, {
          duration,
          rowCount: metrics.rowCount,
          ...context
        })
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      databaseLogger.error(`Query error: ${queryName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        ...context
      })
      
      throw error
    }
  }

  // Optimized query builders
  async getActiveListings(
    filters: {
      location?: string
      urgency?: string
      minPay?: number
      maxPay?: number
      suburbs?: string[]
      limit?: number
      offset?: number
    } = {}
  ) {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'get_active_listings',
      async () => {
        try {
          // First, just get basic listings without join to avoid foreign key issues
          let query = supabase
            .from('listings')
            .select('*')
            .eq('status', 'active')
          
          // Apply filters efficiently
          if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`)
          }
          
          if (filters.urgency) {
            query = query.eq('urgency', filters.urgency)
          }
          
          if (filters.minPay) {
            query = query.gte('pay_min', filters.minPay)
          }
          
          if (filters.maxPay) {
            query = query.lte('pay_max', filters.maxPay)
          }
          
          // Pagination
          if (filters.limit) {
            query = query.limit(filters.limit)
          }
          
          if (filters.offset) {
            query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1)
          }
          
          // Order by most recent and urgent first
          query = query.order('created_at', { ascending: false })
          
          const result = await query

          // Handle case where there are no listings (normal for new platforms)
          if (result.error && result.error.message?.includes('no rows')) {
            return { data: [], error: null, count: 0 }
          }

          // Ensure the return type matches what executeQuery expects
          return {
            data: result.data,
            error: result.error,
            count: result.count !== null ? result.count : undefined
          }
        } catch (error) {
          // Return empty array instead of error for new platforms with no listings
          return { data: [], error: null, count: 0 }
        }
      },
      filters
    )
  }

  async searchCoaches(
    filters: {
      suburbs?: string[]
      specialties?: string[]
      minRating?: number
      maxHourlyRate?: number
      limit?: number
      offset?: number
    } = {}
  ) {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'search_coaches',
      async () => {
        try {
          // Build query for coach profiles
          let query = supabase
            .from('coach_profiles')
            .select('*')

          // Apply filters
          if (filters.suburbs && filters.suburbs.length > 0) {
            // Filter by suburbs - check if any of the coach's suburbs match
            query = query.overlaps('suburbs', filters.suburbs)
          }

          if (filters.specialties && filters.specialties.length > 0) {
            query = query.overlaps('specialties', filters.specialties)
          }

          if (filters.minRating) {
            query = query.gte('rating_avg', filters.minRating)
          }

          if (filters.maxHourlyRate) {
            query = query.lte('rate_hourly', filters.maxHourlyRate)
          }

          // Order by rating and recency
          query = query.order('rating_avg', { ascending: false, nullsFirst: false })
          query = query.order('created_at', { ascending: false })

          // Apply pagination
          if (filters.limit) {
            query = query.limit(filters.limit)
          }

          if (filters.offset) {
            query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1)
          }

          const result = await query

          // Ensure the return type matches what executeQuery expects
          return {
            data: result.data,
            error: result.error,
            count: result.count !== null ? result.count : undefined
          }
        } catch (error) {
          return { data: [], error: null, count: 0 }
        }
      },
      filters
    )
  }

  async getUserDashboardStats(userId: string) {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'get_user_dashboard_stats',
      async () => {
        // Get user's listings count
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('id')
          .eq('org_id', userId)
        
        if (listingsError) return { data: null, error: listingsError }
        
        // Get total applications for user's listings
        const { data: applications, error: applicationsError } = await supabase
          .from('applications')
          .select('id')
          .in('listing_id', listings?.map(l => l.id) || [])
        
        if (applicationsError) return { data: null, error: applicationsError }
        
        // Get total bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('org_id', userId)
        
        if (bookingsError) return { data: null, error: bookingsError }
        
        const dashboardStats = {
          total_listings: listings?.length || 0,
          total_applications: applications?.length || 0,
          total_bookings: bookings?.length || 0
        }
        
        return { data: dashboardStats, error: null }
      },
      { userId }
    )
  }

  async getApplicationsDetailed(filters: {
    coachId?: string
    orgId?: string
    status?: string
    limit?: number
  } = {}) {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'get_applications_detailed',
      async () => {
        try {
          let query = supabase
            .from('applications')
            .select('*')

          if (filters.coachId) {
            query = query.eq('coach_id', filters.coachId)
          }

          if (filters.orgId) {
            // Join with listings to filter by org
            query = query.in('listing_id',
              supabase.from('listings').select('id').eq('org_id', filters.orgId)
            )
          }

          if (filters.status) {
            query = query.eq('status', filters.status)
          }

          if (filters.limit) {
            query = query.limit(filters.limit)
          }

          query = query.order('created_at', { ascending: false })

          const result = await query

          // Ensure the return type matches what executeQuery expects
          return {
            data: result.data,
            error: result.error,
            count: result.count !== null ? result.count : undefined
          }
        } catch (error) {
          return { data: [], error: null, count: 0 }
        }
      },
      filters
    )
  }

  async getCoachAvailability(coachId: string, startDate: string, endDate: string) {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'get_coach_availability',
      async () => {
        const { data, error } = await supabase.rpc('get_coach_availability', {
          coach_user_id: coachId,
          start_date: startDate,
          end_date: endDate
        })
        
        return { data, error }
      },
      { coachId, startDate, endDate }
    )
  }

  // Database maintenance functions
  async analyzeTablePerformance() {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'analyze_table_performance',
      async () => {
        const { data, error } = await supabase
          .from('table_performance_stats')
          .select('*')
          .order('tablename')
        
        return { data, error }
      }
    )
  }

  async getSlowQueries() {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'get_slow_queries',
      async () => {
        const { data, error } = await supabase
          .from('slow_queries')
          .select('*')
          .limit(10)
        
        return { data, error }
      }
    )
  }

  // Query optimization helpers
  private recordQueryMetrics(metrics: QueryMetrics) {
    this.queryHistory.push(metrics)
    
    // Keep only last 1000 queries
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-1000)
    }
    
    // Log slow queries (>500ms)
    if (metrics.duration > 500) {
      databaseLogger.warn(`Slow query detected: ${metrics.query}`, {
        duration: metrics.duration,
        rowCount: metrics.rowCount
      })
    }
  }

  getQueryStats(minutes: number = 5): {
    totalQueries: number
    averageDuration: number
    slowQueries: number
    errorRate: number
  } {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000)
    const recentQueries = this.queryHistory.filter(q => q.timestamp >= cutoffTime)
    
    if (recentQueries.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        errorRate: 0
      }
    }
    
    const totalDuration = recentQueries.reduce((sum, q) => sum + q.duration, 0)
    const slowQueries = recentQueries.filter(q => q.duration > 500).length
    const errorQueries = recentQueries.filter(q => !q.success).length
    
    return {
      totalQueries: recentQueries.length,
      averageDuration: Math.round(totalDuration / recentQueries.length),
      slowQueries,
      errorRate: Math.round((errorQueries / recentQueries.length) * 100 * 100) / 100
    }
  }

  // Batch operations for better performance
  async batchCreateApplications(applications: Array<{
    listingId: string
    coachId: string
    message?: string
    proposedRate?: number
  }>) {
    const supabase = await createServerSupabaseClient()
    
    return this.executeQuery(
      'batch_create_applications',
      async () => {
        const { data, error } = await supabase
          .from('applications')
          .insert(
            applications.map(app => ({
              listing_id: app.listingId,
              coach_id: app.coachId,
              message: app.message,
              proposed_rate: app.proposedRate,
              status: 'pending'
            }))
          )
        
        return { data, error }
      },
      { count: applications.length }
    )
  }

  async batchUpdateApplicationStatus(updates: Array<{
    id: string
    status: 'pending' | 'accepted' | 'rejected'
  }>) {
    const supabase = await createServerSupabaseClient()
    
    // Use multiple single updates for better RLS performance
    const results = await Promise.all(
      updates.map(update => 
        this.executeQuery(
          'update_application_status',
          async () => {
            const { data, error } = await supabase
              .from('applications')
              .update({ status: update.status })
              .eq('id', update.id)
            
            return { data, error }
          },
          { applicationId: update.id, status: update.status }
        )
      )
    )
    
    return {
      data: results.map(r => r.data).filter(Boolean),
      error: results.find(r => r.error)?.error || null
    }
  }
}

export const queryOptimizer = QueryOptimizer.getInstance()

// React hook for client-side query monitoring
export function useDatabaseMetrics() {
  return {
    getQueryStats: () => queryOptimizer.getQueryStats(),
    executeQuery: queryOptimizer.executeQuery.bind(queryOptimizer)
  }
}