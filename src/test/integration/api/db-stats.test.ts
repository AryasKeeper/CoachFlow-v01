import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/db-stats/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/error-handling', () => ({
  withErrorHandling: vi.fn((handler) => async (req) => {
    try {
      return await handler(req)
    } catch (error) {
      throw error // Re-throw for test verification  
    }
  }),
  createAuthError: vi.fn((message) => new Error(`AUTH: ${message}`))
}))

vi.mock('@/lib/database', () => ({
  queryOptimizer: {
    getQueryStats: vi.fn(() => ({
      totalQueries: 150,
      averageDuration: 45.7,
      slowQueries: 3,
      errorRate: 0.02,
      peakQPS: 12.4,
      performanceScore: 0.92
    })),
    analyzeTablePerformance: vi.fn(() => Promise.resolve({
      data: [
        { table: 'coaches', size: '2.1MB', indexes: 4, scanRatio: 0.15 },
        { table: 'listings', size: '1.8MB', indexes: 3, scanRatio: 0.22 }
      ],
      error: null
    })),
    getSlowQueries: vi.fn(() => Promise.resolve({
      data: [
        { 
          query: 'SELECT * FROM coaches WHERE location ILIKE...', 
          duration: 850, 
          count: 5,
          suggestion: 'Add index on location column'
        }
      ],
      error: null
    }))
  }
}))

vi.mock('@/lib/auth/utils', () => ({
  requireRole: vi.fn(() => Promise.resolve(true))
}))

describe('Database Stats API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/db-stats', () => {
    it('returns comprehensive database statistics for admin users', async () => {
      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      const response = await GET(request)
      
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      
      // Should include all expected statistics sections
      expect(data).toHaveProperty('queryStats')
      expect(data).toHaveProperty('tablePerformance')
      expect(data).toHaveProperty('slowQueries')
      expect(data).toHaveProperty('timestamp')
      
      // Verify query stats structure
      expect(data.queryStats).toHaveProperty('totalQueries')
      expect(data.queryStats).toHaveProperty('averageDuration')
      expect(data.queryStats).toHaveProperty('slowQueries')
      expect(data.queryStats).toHaveProperty('errorRate')
      expect(data.queryStats).toHaveProperty('peakQPS')
      expect(data.queryStats).toHaveProperty('performanceScore')
    })

    it('includes table performance analysis', async () => {
      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()
      
      expect(Array.isArray(data.tablePerformance)).toBe(true)
      
      if (data.tablePerformance.length > 0) {
        const tableInfo = data.tablePerformance[0]
        expect(tableInfo).toHaveProperty('table')
        expect(tableInfo).toHaveProperty('size')
        expect(tableInfo).toHaveProperty('indexes')
        expect(tableInfo).toHaveProperty('scanRatio')
      }
    })

    it('includes slow query analysis', async () => {
      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()
      
      expect(Array.isArray(data.slowQueries)).toBe(true)
      
      if (data.slowQueries.length > 0) {
        const slowQuery = data.slowQueries[0]
        expect(slowQuery).toHaveProperty('query')
        expect(slowQuery).toHaveProperty('duration')
        expect(slowQuery).toHaveProperty('count')
      }
    })

    it('requires admin role access', async () => {
      const { requireRole } = await import('@/lib/auth/utils')
      const mockRequireRole = vi.mocked(requireRole)
      
      // Mock access denied for non-admin
      mockRequireRole.mockRejectedValueOnce(new Error('Access denied - Admin role required'))

      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      try {
        await GET(request)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Access denied - Admin role required')
      }
      
      expect(mockRequireRole).toHaveBeenCalledWith('admin')
    })

    it('handles database analysis errors gracefully', async () => {
      const { queryOptimizer } = await import('@/lib/database')
      const mockOptimizer = vi.mocked(queryOptimizer)
      
      // Mock database errors
      mockOptimizer.analyzeTablePerformance.mockRejectedValueOnce(
        new Error('Permission denied')
      )
      mockOptimizer.getSlowQueries.mockRejectedValueOnce(
        new Error('Permission denied')
      )

      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()
      
      // Should still return response with empty arrays for failed operations
      expect(data.tablePerformance).toEqual([])
      expect(data.slowQueries).toEqual([])
      
      // But should still have query stats
      expect(data.queryStats).toHaveProperty('totalQueries')
    })

    it('includes proper timestamp in response', async () => {
      const beforeTime = new Date()
      
      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()
      
      const afterTime = new Date()
      const responseTime = new Date(data.timestamp)
      
      // Timestamp should be recent
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('calls queryOptimizer with correct time window', async () => {
      const { queryOptimizer } = await import('@/lib/database')
      const mockGetQueryStats = vi.mocked(queryOptimizer.getQueryStats)

      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      await GET(request)
      
      // Should request stats for last 30 minutes
      expect(mockGetQueryStats).toHaveBeenCalledWith(30)
    })

    it('returns data in expected format for monitoring systems', async () => {
      const request = new NextRequest('http://localhost:3000/api/db-stats', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()
      
      // Verify numeric fields are numbers
      expect(typeof data.queryStats.totalQueries).toBe('number')
      expect(typeof data.queryStats.averageDuration).toBe('number')
      expect(typeof data.queryStats.errorRate).toBe('number')
      
      // Verify ISO timestamp format
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      
      // Verify arrays are present
      expect(Array.isArray(data.tablePerformance)).toBe(true)
      expect(Array.isArray(data.slowQueries)).toBe(true)
    })
  })
})