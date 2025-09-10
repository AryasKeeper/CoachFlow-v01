import { authLimiter, signupLimiter, passwordResetLimiter } from '@/lib/rate-limiter'
import { NextRequest } from 'next/server'

/**
 * Authentication middleware with rate limiting
 * Apply to all auth-related API routes
 */

export async function withAuthRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const url = new URL(req.url)
  const pathname = url.pathname

  let limiter
  
  // Choose appropriate rate limiter based on endpoint
  if (pathname.includes('/sign-up') || pathname.includes('/register')) {
    limiter = signupLimiter
  } else if (pathname.includes('/reset') || pathname.includes('/forgot')) {
    limiter = passwordResetLimiter  
  } else {
    limiter = authLimiter // Default for sign-in, etc.
  }

  // Apply rate limiting
  const rateLimitMiddleware = limiter.middleware()
  const rateLimitResponse = await rateLimitMiddleware(req)
  
  if (rateLimitResponse) {
    return rateLimitResponse // Rate limit exceeded
  }
  
  // Continue to actual handler
  try {
    const response = await handler(req)
    
    // Add rate limit headers to successful responses
    const result = await limiter.checkLimit(req)
    
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining).toString())
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
    
    return response
  } catch (error) {
    console.error('Auth middleware error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Enhanced password policy validation
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  let score = 0

  // Minimum requirements
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')  
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 1
  }

  // Additional strength checks
  if (password.length >= 16) score += 1
  if (/[a-z].*[a-z]/.test(password)) score += 0.5 // Multiple lowercase
  if (/[A-Z].*[A-Z]/.test(password)) score += 0.5 // Multiple uppercase
  if (/\d.*\d/.test(password)) score += 0.5 // Multiple numbers
  
  // Check for common patterns (weakness indicators) - only flag truly weak patterns
  const commonPatterns = [
    /123456/,
    /^password\d*$/i, // Only flag if password is just "password" + numbers
    /qwerty/i,
    /abc123/i,
    /(.)\1{3,}/, // 3+ repeated characters (was 2+, now more lenient)
  ]
  
  // Only penalize truly simple password structures
  // Check for overly simple patterns only in minimum length passwords
  if (password.length <= 12) {
    const verySimpleWords = ['simple']
    const hasVerySimpleWords = verySimpleWords.some(word => password.toLowerCase().includes(word))
    
    if (hasVerySimpleWords) {
      // Reduce score for very simple words in minimum length passwords
      score -= 1.5
    }
  }
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password contains common patterns and is too predictable')
    score -= 2
  }

  // Determine strength - stricter thresholds
  let strength: 'weak' | 'medium' | 'strong'
  if (score >= 7) {
    strength = 'strong'
  } else if (score >= 6) {
    strength = 'medium' 
  } else {
    strength = 'weak'
  }

  return {
    isValid: errors.length === 0 && strength !== 'weak',
    errors,
    strength
  }
}

/**
 * Input sanitization for auth endpoints
 */
export function sanitizeAuthInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic XSS characters
    .slice(0, 254) // Limit length
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length === 0 || email.length > 254) {
    return false
  }
  
  // More strict email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  // Additional checks for invalid patterns
  if (email.includes('..')) return false // No consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false // No dots at start/end of local part
  if (email.includes(' ')) return false // No spaces
  if (email.startsWith('@') || email.endsWith('@')) return false // Must have local and domain parts
  if (email.split('@').length !== 2) return false // Exactly one @ symbol
  
  const [localPart, domainPart] = email.split('@')
  if (!localPart || !domainPart) return false // Both parts must exist
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false // Domain can't start/end with dot
  
  return emailRegex.test(email)
}

/**
 * Security logging for auth events
 */
export function logSecurityEvent(
  event: 'login_success' | 'login_failure' | 'signup' | 'password_reset',
  details: {
    ip?: string
    userAgent?: string
    email?: string
    userId?: string
    timestamp?: Date
  }
) {
  const logEntry = {
    event,
    timestamp: details.timestamp || new Date(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    email: details.email ? details.email.slice(0, 5) + '***' : undefined, // Partially mask email
    userId: details.userId,
  }
  
  // In production, send to logging service (e.g., Winston, DataDog)
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry))
  
  // For high-security events, could also send alerts
  if (event === 'login_failure') {
    // Could implement alert logic here
  }
}