/**
 * Production-grade rate limiter with multiple strategies
 * Supports IP-based, user-based, and endpoint-specific limits
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (req: Request) => string // Custom key generation
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    firstRequest: number
  }
}

// In-memory store (use Redis in production)
const rateLimitStore: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 5 * 60 * 1000)

export class RateLimiter {
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req: Request) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later',
      ...config
    }
  }

  private getClientIP(req: Request): string {
    // Check various headers for real IP in production
    const headers = req.headers
    
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return headers.get('x-real-ip') ||
           headers.get('cf-connecting-ip') ||
           headers.get('x-client-ip') ||
           'unknown'
  }

  async checkLimit(req: Request): Promise<{
    success: boolean
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = this.config.keyGenerator(req)
    const now = Date.now()
    
    let entry = rateLimitStore[key]
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      }
      rateLimitStore[key] = entry
      
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: entry.resetTime
      }
    }
    
    // Increment count
    entry.count++
    
    if (entry.count <= this.config.maxRequests) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - entry.count,
        resetTime: entry.resetTime
      }
    }
    
    // Rate limit exceeded
    return {
      success: false,
      limit: this.config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  middleware() {
    return async (req: Request): Promise<Response | null> => {
      const result = await this.checkLimit(req)
      
      if (result.success) {
        // Add rate limit headers to successful responses
        return null // Continue to next middleware/handler
      }
      
      // Rate limit exceeded
      return new Response(
        JSON.stringify({
          error: this.config.message,
          limit: result.limit,
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': result.retryAfter?.toString() || '60'
          }
        }
      )
    }
  }
}

// Predefined rate limiters for different use cases
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again in 15 minutes'
})

export const signupLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 signups per hour per IP
  message: 'Too many signup attempts, please try again in an hour'
})

export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 API calls per 15 minutes
  message: 'API rate limit exceeded, please slow down'
})

export const strictLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10, // 10 requests per 5 minutes
  message: 'Rate limit exceeded for sensitive operation'
})

// Password reset limiter
export const passwordResetLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again in an hour'
})