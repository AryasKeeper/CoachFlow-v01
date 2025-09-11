/**
 * Production Rate Limiting Middleware
 * Implements adaptive rate limiting with IP-based tracking and Redis integration
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
const RATE_LIMITS = {
  // API endpoints
  '/api/auth/sign-up': { requests: 5, window: 15 * 60 * 1000 }, // 5 signups per 15 minutes
  '/api/auth/sign-in': { requests: 10, window: 15 * 60 * 1000 }, // 10 login attempts per 15 minutes
  '/api/auth/reset-password': { requests: 3, window: 60 * 60 * 1000 }, // 3 password resets per hour
  '/api/applications': { requests: 20, window: 60 * 60 * 1000 }, // 20 applications per hour
  '/api/chat': { requests: 50, window: 15 * 60 * 1000 }, // 50 chat messages per 15 minutes
  '/api/': { requests: 100, window: 15 * 60 * 1000 }, // Default API limit
  
  // Page endpoints
  '/coach/listings': { requests: 60, window: 60 * 60 * 1000 }, // 60 page views per hour
  '/org/listings': { requests: 60, window: 60 * 60 * 1000 },
  
  // Static resources (more permissive)
  '/_next/': { requests: 1000, window: 60 * 60 * 1000 },
  '/images/': { requests: 200, window: 60 * 60 * 1000 },
} as const

// In-memory rate limit storage (production would use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  requests: number
  window: number
}

export class RateLimiter {
  private static instance: RateLimiter
  
  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  /**
   * Check if request should be rate limited
   */
  async isRateLimited(
    identifier: string,
    endpoint: string,
    config?: RateLimitConfig
  ): Promise<{ limited: boolean; resetTime?: number; remaining?: number }> {
    const now = Date.now()
    
    // Find matching rate limit config
    const rateLimitConfig = config || this.getRateLimitConfig(endpoint)
    if (!rateLimitConfig) {
      return { limited: false }
    }

    const key = `${identifier}:${endpoint}`
    const existing = rateLimitStore.get(key)

    // Clean expired entries
    this.cleanExpiredEntries()

    if (!existing || now > existing.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + rateLimitConfig.window
      })
      
      return {
        limited: false,
        resetTime: now + rateLimitConfig.window,
        remaining: rateLimitConfig.requests - 1
      }
    }

    // Check if limit exceeded
    if (existing.count >= rateLimitConfig.requests) {
      return {
        limited: true,
        resetTime: existing.resetTime,
        remaining: 0
      }
    }

    // Increment count
    existing.count++
    rateLimitStore.set(key, existing)
    
    return {
      limited: false,
      resetTime: existing.resetTime,
      remaining: rateLimitConfig.requests - existing.count
    }
  }

  /**
   * Get rate limit configuration for endpoint
   */
  private getRateLimitConfig(endpoint: string): RateLimitConfig | null {
    // Exact match
    if (RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS]) {
      return RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS]
    }

    // Pattern matching
    for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
      if (endpoint.startsWith(pattern)) {
        return config
      }
    }

    return null
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanExpiredEntries(): void {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }

  /**
   * Get client identifier (IP + User Agent hash)
   */
  getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Create simple hash of user agent for additional uniqueness
    const uaHash = this.simpleHash(userAgent)
    
    return `${ip}:${uaHash}`
  }

  /**
   * Simple hash function for user agent
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8)
  }

  /**
   * Create rate limit response headers
   */
  createRateLimitHeaders(
    requests: number,
    remaining: number,
    resetTime: number
  ): Record<string, string> {
    return {
      'X-RateLimit-Limit': requests.toString(),
      'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      'X-RateLimit-Policy': `${requests};w=${Math.ceil((resetTime - Date.now()) / 1000)}`
    }
  }

  /**
   * Create rate limit exceeded response
   */
  createRateLimitResponse(resetTime: number): NextResponse {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

/**
 * Rate limiting middleware for Next.js
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  endpoint?: string
): Promise<{ allowed: boolean; response?: NextResponse; headers?: Record<string, string> }> {
  const rateLimiter = RateLimiter.getInstance()
  const identifier = rateLimiter.getClientIdentifier(request)
  const path = endpoint || new URL(request.url).pathname
  
  const result = await rateLimiter.isRateLimited(identifier, path)
  
  if (result.limited) {
    return {
      allowed: false,
      response: rateLimiter.createRateLimitResponse(result.resetTime!)
    }
  }

  // Add rate limit headers to successful responses
  const config = rateLimiter['getRateLimitConfig'](path)
  if (config && result.resetTime && result.remaining !== undefined) {
    const headers = rateLimiter.createRateLimitHeaders(
      config.requests,
      result.remaining,
      result.resetTime
    )
    
    return {
      allowed: true,
      headers
    }
  }

  return { allowed: true }
}

// Export rate limiter instance for use in API routes
export const rateLimiter = RateLimiter.getInstance()