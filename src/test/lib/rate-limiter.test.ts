import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { RateLimiter, authLimiter, signupLimiter, apiLimiter, strictLimiter, passwordResetLimiter } from '@/lib/rate-limiter'

// Mock setTimeout and setInterval for testing
vi.mock('node:timers', () => ({
  setInterval: vi.fn(() => ({ unref: vi.fn() })),
  clearInterval: vi.fn()
}))

// Helper to create mock Request
function createMockRequest(headers: Record<string, string> = {}): Request {
  const mockHeaders = {
    get: (key: string) => headers[key.toLowerCase()] || null,
    has: (key: string) => key.toLowerCase() in headers,
    entries: () => Object.entries(headers)[Symbol.iterator](),
    keys: () => Object.keys(headers)[Symbol.iterator](),
    values: () => Object.values(headers)[Symbol.iterator]()
  }
  
  return {
    headers: mockHeaders
  } as unknown as Request
}

describe('RateLimiter', () => {
  let limiter: RateLimiter
  
  beforeEach(() => {
    vi.useFakeTimers()
    limiter = new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3,
      message: 'Rate limit exceeded'
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('creates instance with default configuration', () => {
      const testLimiter = new RateLimiter({
        windowMs: 5000,
        maxRequests: 10
      })

      expect(testLimiter).toBeInstanceOf(RateLimiter)
    })

    it('merges custom config with defaults', () => {
      const testLimiter = new RateLimiter({
        windowMs: 10000,
        maxRequests: 5,
        message: 'Custom message',
        skipSuccessfulRequests: true
      })

      expect(testLimiter).toBeInstanceOf(RateLimiter)
    })
  })

  describe('getClientIP', () => {
    it('extracts IP from x-forwarded-for header', async () => {
      const req = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1'
      })

      const result = await limiter.checkLimit(req)
      expect(result.success).toBe(true)
    })

    it('extracts IP from x-real-ip header when x-forwarded-for is not present', async () => {
      const req = createMockRequest({
        'x-real-ip': '192.168.1.2'
      })

      const result = await limiter.checkLimit(req)
      expect(result.success).toBe(true)
    })

    it('extracts IP from cf-connecting-ip header', async () => {
      const req = createMockRequest({
        'cf-connecting-ip': '192.168.1.3'
      })

      const result = await limiter.checkLimit(req)
      expect(result.success).toBe(true)
    })

    it('uses unknown when no IP headers are present', async () => {
      const req = createMockRequest({})

      const result = await limiter.checkLimit(req)
      expect(result.success).toBe(true)
    })
  })

  describe('checkLimit', () => {
    it('allows first request within limit', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '10.0.0.1' })

      const result = await limiter.checkLimit(req)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
      expect(result.remaining).toBe(2) // maxRequests - 1 = 3 - 1 = 2
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('tracks multiple requests from same IP', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '10.0.0.2' })

      // First request
      let result = await limiter.checkLimit(req)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)

      // Second request
      result = await limiter.checkLimit(req)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)

      // Third request (at limit)
      result = await limiter.checkLimit(req)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('rejects requests when limit exceeded', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '10.0.0.3' })

      // Exhaust the limit
      await limiter.checkLimit(req) // 1
      await limiter.checkLimit(req) // 2
      await limiter.checkLimit(req) // 3

      // Fourth request should fail
      const result = await limiter.checkLimit(req)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('handles requests from different IPs independently', async () => {
      const req1 = createMockRequest({ 'x-forwarded-for': '10.0.0.4' })
      const req2 = createMockRequest({ 'x-forwarded-for': '10.0.0.5' })

      // Exhaust limit for first IP
      await limiter.checkLimit(req1) // 1
      await limiter.checkLimit(req1) // 2
      await limiter.checkLimit(req1) // 3

      const result1 = await limiter.checkLimit(req1)
      expect(result1.success).toBe(false)

      // Second IP should still work
      const result2 = await limiter.checkLimit(req2)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(2)
    })

    it('resets count after window expires', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '10.0.0.6' })

      // Exhaust the limit
      await limiter.checkLimit(req)
      await limiter.checkLimit(req)
      await limiter.checkLimit(req)

      const failResult = await limiter.checkLimit(req)
      expect(failResult.success).toBe(false)

      // Fast forward past window
      vi.advanceTimersByTime(61 * 1000) // 1 minute + 1 second

      // Should work again
      const successResult = await limiter.checkLimit(req)
      expect(successResult.success).toBe(true)
      expect(successResult.remaining).toBe(2)
    })
  })

  describe('middleware', () => {
    it('returns null when request is within limit', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '10.0.0.7' })
      const middleware = limiter.middleware()

      const response = await middleware(req)
      expect(response).toBeNull()
    })

    it('returns 429 response when limit exceeded', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '10.0.0.8' })
      const middleware = limiter.middleware()

      // Exhaust the limit
      await limiter.checkLimit(req)
      await limiter.checkLimit(req)
      await limiter.checkLimit(req)

      // Next request should return 429
      const response = await middleware(req)
      expect(response).toBeInstanceOf(Response)
      expect(response!.status).toBe(429)

      const body = await response!.json()
      expect(body.error).toBe('Rate limit exceeded')
      expect(body.limit).toBe(3)
      expect(body.retryAfter).toBeGreaterThan(0)
    })

    it('includes proper rate limit headers in 429 response', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '10.0.0.9' })
      const middleware = limiter.middleware()

      // Exhaust the limit
      await limiter.checkLimit(req)
      await limiter.checkLimit(req)
      await limiter.checkLimit(req)

      const response = await middleware(req)
      expect(response!.headers.get('X-RateLimit-Limit')).toBe('3')
      expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response!.headers.get('X-RateLimit-Reset')).toBeTruthy()
      expect(response!.headers.get('Retry-After')).toBeTruthy()
    })
  })

  describe('custom key generator', () => {
    it('uses custom key generator when provided', async () => {
      const customLimiter = new RateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 2,
        keyGenerator: (req: Request) => 'custom-key'
      })

      const req1 = createMockRequest({ 'x-forwarded-for': '192.168.1.1' })
      const req2 = createMockRequest({ 'x-forwarded-for': '192.168.1.2' })

      // Both requests should share the same limit since they use same key
      await customLimiter.checkLimit(req1) // 1
      await customLimiter.checkLimit(req2) // 2

      // Third request from any IP should fail
      const result = await customLimiter.checkLimit(req1)
      expect(result.success).toBe(false)
    })
  })
})

describe('Predefined Rate Limiters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('authLimiter', () => {
    it('has correct configuration for authentication', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '192.168.2.1' }) // Unique IP

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await authLimiter.checkLimit(req)
        expect(result.success).toBe(true)
      }

      // 6th should fail
      const result = await authLimiter.checkLimit(req)
      expect(result.success).toBe(false)

      const middleware = authLimiter.middleware()
      const response = await middleware(req)
      const body = await response!.json()
      expect(body.error).toContain('login attempts')
    })
  })

  describe('signupLimiter', () => {
    it('has correct configuration for signup', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '192.168.2.2' }) // Unique IP

      // Should allow 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await signupLimiter.checkLimit(req)
        expect(result.success).toBe(true)
      }

      // 4th should fail
      const result = await signupLimiter.checkLimit(req)
      expect(result.success).toBe(false)

      const middleware = signupLimiter.middleware()
      const response = await middleware(req)
      const body = await response!.json()
      expect(body.error).toContain('signup attempts')
    })
  })

  describe('apiLimiter', () => {
    it('has correct configuration for API calls', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '192.168.2.3' }) // Unique IP

      // Check that limit is set to 100
      const result = await apiLimiter.checkLimit(req)
      expect(result.success).toBe(true)
      expect(result.limit).toBe(100)
      expect(result.remaining).toBe(99)
    })
  })

  describe('strictLimiter', () => {
    it('has correct configuration for sensitive operations', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '192.168.2.4' }) // Unique IP

      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        const result = await strictLimiter.checkLimit(req)
        expect(result.success).toBe(true)
      }

      // 11th should fail
      const result = await strictLimiter.checkLimit(req)
      expect(result.success).toBe(false)

      const middleware = strictLimiter.middleware()
      const response = await middleware(req)
      const body = await response!.json()
      expect(body.error).toContain('sensitive operation')
    })
  })

  describe('passwordResetLimiter', () => {
    it('has correct configuration for password reset', async () => {
      const req = createMockRequest({ 'x-forwarded-for': '192.168.2.5' }) // Unique IP

      // Should allow 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await passwordResetLimiter.checkLimit(req)
        expect(result.success).toBe(true)
      }

      // 4th should fail
      const result = await passwordResetLimiter.checkLimit(req)
      expect(result.success).toBe(false)

      const middleware = passwordResetLimiter.middleware()
      const response = await middleware(req)
      const body = await response!.json()
      expect(body.error).toContain('password reset attempts')
    })
  })
})

describe('Store Cleanup', () => {
  let testLimiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    testLimiter = new RateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 5,
      message: 'Test limiter'
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('allows fresh requests after cleanup period', async () => {
    const req = createMockRequest({ 'x-forwarded-for': '192.168.3.1' })

    // Make requests to exhaust limit
    await testLimiter.checkLimit(req) // 1
    await testLimiter.checkLimit(req) // 2
    await testLimiter.checkLimit(req) // 3
    await testLimiter.checkLimit(req) // 4
    await testLimiter.checkLimit(req) // 5

    // Next request should fail
    let result = await testLimiter.checkLimit(req)
    expect(result.success).toBe(false)

    // Fast forward past cleanup period (5 minutes + 1 second)
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000)

    // After cleanup period, new requests should work fresh
    // This verifies that expired entries don't interfere with new windows
    result = await testLimiter.checkLimit(req)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4) // Fresh window with 5 max requests - 1 = 4 remaining
  })
})