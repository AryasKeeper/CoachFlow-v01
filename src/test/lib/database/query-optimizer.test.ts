import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queryOptimizer } from '@/lib/database/query-optimizer'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    rpc: vi.fn(() => ({
      data: [],
      error: null
    }))
  }))
}))

// Mock the logger
vi.mock('@/lib/monitoring', () => ({
  databaseLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    critical: vi.fn()
  },
  performanceMonitor: {
    recordMetric: vi.fn()
  }
}))

describe('QueryOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('executeQuery', () => {
    it('executes query successfully and records metrics', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Test' }],
        error: null,
        count: 1
      })

      const result = await queryOptimizer.executeQuery('test_query', mockQueryFn)

      expect(mockQueryFn).toHaveBeenCalled()
      expect(result.data).toEqual([{ id: 1, name: 'Test' }])
      expect(result.error).toBeNull()
    })

    it('handles query errors gracefully', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await queryOptimizer.executeQuery('failing_query', mockQueryFn)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Database error' })
    })

    it('records slow query metrics', async () => {
      const mockQueryFn = vi.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: [], error: null }), 600)
        )
      )

      await queryOptimizer.executeQuery('slow_query', mockQueryFn)

      // Should record the query as slow (>500ms)
      const stats = queryOptimizer.getQueryStats(1)
      expect(stats.slowQueries).toBeGreaterThan(0)
    })

    it('propagates exceptions from query function', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Connection failed'))

      await expect(
        queryOptimizer.executeQuery('error_query', mockQueryFn)
      ).rejects.toThrow('Connection failed')
    })
  })

  describe('getQueryStats', () => {
    it('returns empty stats when no queries executed', () => {
      // Create a new instance to ensure clean state
      const optimizer = new (queryOptimizer.constructor as any)()
      const stats = optimizer.getQueryStats(5)

      expect(stats.totalQueries).toBe(0)
      expect(stats.averageDuration).toBe(0)
      expect(stats.slowQueries).toBe(0)
      expect(stats.errorRate).toBe(0)
    })

    it('calculates stats correctly for recent queries', async () => {
      // Execute a few test queries to generate stats
      const fastQuery = vi.fn().mockResolvedValue({ data: [], error: null })
      const slowQuery = vi.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: [], error: null }), 600)
        )
      )
      const errorQuery = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Error' }
      })

      await queryOptimizer.executeQuery('fast', fastQuery)
      await queryOptimizer.executeQuery('slow', slowQuery)
      await queryOptimizer.executeQuery('error', errorQuery)

      const stats = queryOptimizer.getQueryStats(1)
      
      expect(stats.totalQueries).toBeGreaterThan(0)
      expect(stats.slowQueries).toBeGreaterThan(0)
      expect(stats.errorRate).toBeGreaterThan(0)
    })
  })

  describe('searchCoaches', () => {
    it('calls RPC function with correct parameters', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      
      // Mock the createServerSupabaseClient to return our mock
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabaseClient
        .mockResolvedValue(mockSupabase as any)

      const filters = {
        suburbs: ['Sydney'],
        specialties: ['Basketball'],
        minRating: 4.0,
        maxHourlyRate: 100,
        limit: 10,
        offset: 0
      }

      await queryOptimizer.searchCoaches(filters)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_coaches', {
        search_suburbs: filters.suburbs,
        search_specialties: filters.specialties,
        min_rating: filters.minRating,
        max_hourly_rate: filters.maxHourlyRate,
        limit_count: filters.limit,
        offset_count: filters.offset
      })
    })

    it('handles empty filters correctly', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabaseClient
        .mockResolvedValue(mockSupabase as any)

      await queryOptimizer.searchCoaches({})

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_coaches', {
        search_suburbs: null,
        search_specialties: null,
        min_rating: null,
        max_hourly_rate: null,
        limit_count: 20,
        offset_count: 0
      })
    })
  })

  describe('batchCreateApplications', () => {
    it('formats application data correctly', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: [], error: null })
      const mockFrom = vi.fn(() => ({
        insert: mockInsert
      }))
      
      const mockSupabase = {
        from: mockFrom
      }
      
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabaseClient
        .mockResolvedValue(mockSupabase as any)

      const applications = [
        {
          listingId: 'listing-1',
          coachId: 'coach-1',
          message: 'I am interested',
          proposedRate: 50
        },
        {
          listingId: 'listing-2',
          coachId: 'coach-2'
        }
      ]

      await queryOptimizer.batchCreateApplications(applications)

      expect(mockFrom).toHaveBeenCalledWith('applications')
      expect(mockInsert).toHaveBeenCalledWith([
        {
          listing_id: 'listing-1',
          coach_id: 'coach-1',
          message: 'I am interested',
          proposed_rate: 50,
          status: 'pending'
        },
        {
          listing_id: 'listing-2',
          coach_id: 'coach-2',
          message: undefined,
          proposed_rate: undefined,
          status: 'pending'
        }
      ])
    })
  })
})