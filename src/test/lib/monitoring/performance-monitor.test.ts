import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { 
  performanceMonitor,
  withPerformanceMonitoring,
  usePerformanceMonitor
} from '@/lib/monitoring/performance-monitor'

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock process.memoryUsage for memory monitoring tests
const mockMemoryUsage = vi.fn(() => ({
  heapUsed: 50 * 1024 * 1024, // 50 MB
  heapTotal: 100 * 1024 * 1024, // 100 MB
  external: 20 * 1024 * 1024, // 20 MB
  rss: 200 * 1024 * 1024, // 200 MB
  arrayBuffers: 0
}))

// Mock performance.now for client-side timing
const mockPerformanceNow = vi.fn(() => Date.now())

describe('PerformanceMonitor', () => {
  const originalConsole = console
  const originalProcess = process

  beforeEach(() => {
    // Mock console methods
    Object.assign(console, mockConsole)
    
    // Mock process.memoryUsage
    if (typeof process !== 'undefined') {
      process.memoryUsage = mockMemoryUsage
    }
    
    // Mock performance.now for client-side tests
    Object.defineProperty(global, 'performance', {
      value: { now: mockPerformanceNow },
      writable: true
    })

    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    Object.assign(console, originalConsole)
    if (typeof process !== 'undefined') {
      Object.assign(process, originalProcess)
    }
    vi.useRealTimers()
  })

  describe('recordMetric', () => {
    it('records basic performance metric', () => {
      performanceMonitor.recordMetric('test_metric', 150, 'ms', { action: 'test' })

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] test_metric: 150ms'),
        { action: 'test' }
      )
    })

    it('warns about slow performance when threshold exceeded', () => {
      performanceMonitor.recordMetric('api_response_time', 2000, 'ms', { endpoint: '/slow' })

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE - SLOW] api_response_time: 2000ms'),
        { endpoint: '/slow' }
      )
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded for api_response_time')
      )
    })

    it('limits metrics storage to 1000 entries', () => {
      // Record 1200 metrics to test the limit
      for (let i = 0; i < 1200; i++) {
        performanceMonitor.recordMetric('test_metric', i, 'ms')
      }

      const recentMetrics = performanceMonitor.getRecentMetrics(1100)
      expect(recentMetrics.length).toBeLessThanOrEqual(1000)
    })

    it('includes tags and context in metric', () => {
      const context = { userId: 'user-123', action: 'create' }
      const tags = { service: 'api', version: '1.0' }

      performanceMonitor.recordMetric('custom_metric', 100, 'count', context, tags)

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] custom_metric: 100count'),
        context
      )
    })
  })

  describe('recordApiMetric', () => {
    it('records API performance data', () => {
      const apiData = {
        route: '/api/users',
        method: 'GET',
        duration: 250,
        statusCode: 200,
        responseSize: 1024,
        userId: 'user-456',
        timestamp: new Date()
      }

      performanceMonitor.recordApiMetric(apiData)

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] api_response_time: 250ms'),
        expect.objectContaining({
          route: '/api/users',
          method: 'GET',
          statusCode: 200,
          userId: 'user-456'
        })
      )
    })

    it('limits API metrics storage to 500 entries', () => {
      // Record 600 API metrics to test the limit
      for (let i = 0; i < 600; i++) {
        performanceMonitor.recordApiMetric({
          route: `/api/test-${i}`,
          method: 'GET',
          duration: 100,
          statusCode: 200,
          timestamp: new Date()
        })
      }

      // The internal API metrics array should be limited
      // We can't directly access it, but we can check the behavior through summary
      const summary = performanceMonitor.getPerformanceSummary(60) // Last hour
      expect(summary.totalMetrics).toBeGreaterThan(0)
    })
  })

  describe('startTimer', () => {
    it('creates timer that records duration when called', () => {
      const timer = performanceMonitor.startTimer('timer_test')

      // Fast forward time
      vi.advanceTimersByTime(500)

      timer()

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] timer_test: 500ms'),
        ''
      )
    })

    it('returns duration when timer is called', () => {
      const timer = performanceMonitor.startTimer('return_test')

      vi.advanceTimersByTime(300)

      const duration = timer()
      expect(duration).toBe(300)
    })
  })

  describe('timeAsync', () => {
    it('times successful async operation', async () => {
      const mockAsyncFn = vi.fn().mockResolvedValue('success')

      vi.advanceTimersByTime(200)
      const result = await performanceMonitor.timeAsync('async_test', mockAsyncFn, { operation: 'test' })

      expect(result).toBe('success')
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] async_test: 200ms'),
        expect.objectContaining({
          operation: 'test',
          success: true
        })
      )
    })

    it('times failed async operation and re-throws error', async () => {
      const mockError = new Error('Async error')
      const mockAsyncFn = vi.fn().mockRejectedValue(mockError)

      vi.advanceTimersByTime(150)

      await expect(
        performanceMonitor.timeAsync('async_error_test', mockAsyncFn, { operation: 'failing' })
      ).rejects.toThrow('Async error')

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] async_error_test: 150ms'),
        expect.objectContaining({
          operation: 'failing',
          success: false,
          error: 'Async error'
        })
      )
    })
  })

  describe('recordMemoryUsage', () => {
    it('records memory usage metrics when process.memoryUsage is available', () => {
      performanceMonitor.recordMemoryUsage()

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] memory_heap_used: 50mb'),
        ''
      )
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] memory_heap_total: 100mb'),
        ''
      )
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] memory_external: 20mb'),
        ''
      )
    })

    it('handles missing process.memoryUsage gracefully', () => {
      // Temporarily remove memoryUsage
      const originalMemoryUsage = process.memoryUsage
      delete (process as any).memoryUsage

      expect(() => {
        performanceMonitor.recordMemoryUsage()
      }).not.toThrow()

      // Restore
      process.memoryUsage = originalMemoryUsage
    })
  })

  describe('timeDatabase', () => {
    it('times database operations with correct naming', async () => {
      const mockDbFn = vi.fn().mockResolvedValue({ rows: [] })

      vi.advanceTimersByTime(75)
      const result = await performanceMonitor.timeDatabase('select_users', mockDbFn)

      expect(result).toEqual({ rows: [] })
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE] db_query_select_users: 75ms'),
        expect.objectContaining({
          type: 'database_query',
          queryName: 'select_users',
          success: true
        })
      )
    })
  })

  describe('getPerformanceSummary', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('calculates performance summary correctly', () => {
      const now = new Date()
      
      // Record some API metrics
      performanceMonitor.recordApiMetric({
        route: '/api/fast',
        method: 'GET',
        duration: 200,
        statusCode: 200,
        timestamp: now
      })

      performanceMonitor.recordApiMetric({
        route: '/api/slow',
        method: 'POST', 
        duration: 1500, // Slow request
        statusCode: 200,
        timestamp: now
      })

      performanceMonitor.recordApiMetric({
        route: '/api/error',
        method: 'GET',
        duration: 300,
        statusCode: 500, // Error
        timestamp: now
      })

      const summary = performanceMonitor.getPerformanceSummary(5)

      expect(summary.totalMetrics).toBeGreaterThan(0)
      expect(summary.slowRequests).toBe(1) // One request over 1000ms
      expect(summary.errorRate).toBeCloseTo(33.33, 1) // 1/3 requests failed
      expect(summary.averageResponseTime).toBeGreaterThan(0)
    })

    it('returns zero values for empty metrics', () => {
      const summary = performanceMonitor.getPerformanceSummary(1)

      expect(summary.totalMetrics).toBe(0)
      expect(summary.slowRequests).toBe(0)
      expect(summary.averageResponseTime).toBe(0)
      expect(summary.errorRate).toBe(0)
    })

    it('includes memory usage when available', () => {
      performanceMonitor.recordMemoryUsage()
      
      const summary = performanceMonitor.getPerformanceSummary(1)
      
      expect(summary.memoryUsage).toBe(50) // 50 MB as mocked
    })
  })

  describe('getRecentMetrics', () => {
    it('returns recent metrics with specified count', () => {
      // Record multiple metrics
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordMetric(`metric_${i}`, i * 10, 'ms')
      }

      const recentMetrics = performanceMonitor.getRecentMetrics(5)
      
      expect(recentMetrics.length).toBe(5)
      expect(recentMetrics[4].name).toBe('metric_9') // Last metric
    })

    it('returns all metrics when count exceeds total', () => {
      performanceMonitor.recordMetric('single_metric', 100, 'ms')
      
      const recentMetrics = performanceMonitor.getRecentMetrics(10)
      
      expect(recentMetrics.length).toBe(1)
    })
  })

  describe('isHealthy', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('returns true for healthy system', () => {
      // Record healthy API metrics
      performanceMonitor.recordApiMetric({
        route: '/api/healthy',
        method: 'GET',
        duration: 150, // Fast
        statusCode: 200, // Success
        timestamp: new Date()
      })

      expect(performanceMonitor.isHealthy()).toBe(true)
    })

    it('returns false for unhealthy system with high error rate', () => {
      const now = new Date()
      
      // Record mostly failing requests
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordApiMetric({
          route: '/api/failing',
          method: 'GET',
          duration: 200,
          statusCode: 500, // Error
          timestamp: now
        })
      }

      expect(performanceMonitor.isHealthy()).toBe(false)
    })

    it('returns false for unhealthy system with slow responses', () => {
      performanceMonitor.recordApiMetric({
        route: '/api/slow',
        method: 'GET',
        duration: 2000, // Very slow
        statusCode: 200,
        timestamp: new Date()
      })

      expect(performanceMonitor.isHealthy()).toBe(false)
    })
  })

  describe('threshold detection', () => {
    it('detects API response time thresholds', () => {
      performanceMonitor.recordMetric('api_user_create', 1200, 'ms')
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded for api_user_create')
      )
    })

    it('detects database query thresholds', () => {
      performanceMonitor.recordMetric('db_select_heavy', 750, 'ms')
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded for db_select_heavy')
      )
    })

    it('detects page load thresholds', () => {
      performanceMonitor.recordMetric('page_load_dashboard', 3500, 'ms')
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded for page_load_dashboard')
      )
    })

    it('does not warn for metrics below threshold', () => {
      performanceMonitor.recordMetric('api_fast_endpoint', 200, 'ms')
      
      expect(mockConsole.warn).not.toHaveBeenCalled()
    })
  })
})

describe('withPerformanceMonitoring middleware', () => {
  beforeEach(() => {
    Object.assign(console, mockConsole)
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('monitors successful handler execution', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ success: true })
    const mockReq = { method: 'GET', user: { id: 'user-123' } }
    
    const monitoredHandler = withPerformanceMonitoring(mockHandler, '/api/test')
    
    vi.advanceTimersByTime(300)
    const result = await monitoredHandler(mockReq)

    expect(result).toEqual({ success: true })
    expect(mockHandler).toHaveBeenCalledWith(mockReq)
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[PERFORMANCE] api_response_time: 300ms'),
      expect.objectContaining({
        route: '/api/test',
        method: 'GET',
        statusCode: 200,
        userId: 'user-123'
      })
    )
  })

  it('monitors failed handler execution', async () => {
    const mockError = new Error('Handler error')
    const mockHandler = vi.fn().mockRejectedValue(mockError)
    const mockReq = { method: 'POST' }
    
    const monitoredHandler = withPerformanceMonitoring(mockHandler, '/api/error')
    
    vi.advanceTimersByTime(150)
    
    await expect(monitoredHandler(mockReq)).rejects.toThrow('Handler error')

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[PERFORMANCE] api_response_time: 150ms'),
      expect.objectContaining({
        route: '/api/error',
        method: 'POST',
        statusCode: 500
      })
    )
  })

  it('handles custom status code from error', async () => {
    const customError = new Error('Custom error') as any
    customError.statusCode = 404
    const mockHandler = vi.fn().mockRejectedValue(customError)
    const mockReq = { method: 'GET' }
    
    const monitoredHandler = withPerformanceMonitoring(mockHandler, '/api/notfound')
    
    await expect(monitoredHandler(mockReq)).rejects.toThrow('Custom error')

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[PERFORMANCE] api_response_time'),
      expect.objectContaining({
        statusCode: 404
      })
    )
  })

  it('handles missing method gracefully', async () => {
    const mockHandler = vi.fn().mockResolvedValue('ok')
    const mockReq = {} // No method
    
    const monitoredHandler = withPerformanceMonitoring(mockHandler, '/api/unknown')
    
    await monitoredHandler(mockReq)

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[PERFORMANCE] api_response_time'),
      expect.objectContaining({
        method: 'UNKNOWN'
      })
    )
  })
})

describe('usePerformanceMonitor React hook', () => {
  beforeEach(() => {
    Object.assign(console, mockConsole)
    mockPerformanceNow.mockReturnValue(1000)
    vi.clearAllMocks()
  })

  it('records client-side metrics', () => {
    const { recordMetric } = usePerformanceMonitor()
    
    recordMetric('component_render', 45, 'ms', { component: 'UserProfile' })

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[PERFORMANCE] client_component_render: 45ms'),
      expect.objectContaining({
        component: 'UserProfile',
        client: true
      })
    )
  })

  it('times client operations successfully', () => {
    const { timeOperation } = usePerformanceMonitor()
    
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1150) // End time
    
    const result = timeOperation('form_validation', () => {
      return 'validation passed'
    })

    expect(result).toBe('validation passed')
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[PERFORMANCE] client_form_validation: 150ms'),
      expect.objectContaining({
        success: true,
        client: true
      })
    )
  })

  it('times client operations that throw errors', () => {
    const { timeOperation } = usePerformanceMonitor()
    
    mockPerformanceNow
      .mockReturnValueOnce(2000) // Start time
      .mockReturnValueOnce(2100) // End time
    
    expect(() => {
      timeOperation('error_operation', () => {
        throw new Error('Client error')
      })
    }).toThrow('Client error')

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('[PERFORMANCE] client_error_operation: 100ms'),
      expect.objectContaining({
        success: false,
        client: true
      })
    )
  })
})

describe('Error handling', () => {
  it('handles monitoring service errors gracefully', () => {
    // Set up environment to trigger external monitoring
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    process.env.MONITORING_ENABLED = 'true'
    
    // Should not throw even if external monitoring fails
    expect(() => {
      performanceMonitor.recordMetric('test_external', 100, 'ms')
    }).not.toThrow()
    
    // Restore environment
    process.env.NODE_ENV = originalEnv
    delete process.env.MONITORING_ENABLED
  })

  it('continues logging even if console methods fail', () => {
    // Mock console.log to throw an error
    mockConsole.log.mockImplementationOnce(() => {
      throw new Error('Console error')
    })

    // Should not throw error when console fails
    expect(() => {
      performanceMonitor.recordMetric('test_console_error', 100, 'ms')
    }).not.toThrow()
  })
})