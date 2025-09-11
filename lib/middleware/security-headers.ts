/**
 * Production Security Headers Middleware
 * Implements comprehensive security headers for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'

export interface SecurityHeadersConfig {
  // Content Security Policy
  csp?: {
    enabled: boolean
    directives?: Record<string, string[]>
    reportOnly?: boolean
  }
  
  // HTTPS enforcement
  hsts?: {
    enabled: boolean
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  
  // Additional security headers
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
  contentTypeOptions?: boolean
  referrerPolicy?: string
  permissionsPolicy?: Record<string, string[]>
  crossOriginEmbedderPolicy?: 'require-corp' | 'unsafe-none'
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none'
  crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin'
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  csp: {
    enabled: process.env.NODE_ENV === 'production', // Only enable CSP in production
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js in development
        "'unsafe-eval'", // Required for Next.js development and some build tools
        'https://cdn.vercel-insights.com',
        'https://va.vercel-scripts.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://js.sentry-cdn.com',
        'https://browser.sentry-cdn.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://*.supabase.co',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.openai.com',
        'https://vitals.vercel-insights.com',
        'https://www.google-analytics.com',
        'https://o4507902734409728.ingest.sentry.io',
        'https://*.ingest.sentry.io'
      ],
      'frame-src': [
        "'self'",
        'https://js.sentry-cdn.com'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"]
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },
  
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  
  permissionsPolicy: {
    'camera': [],
    'microphone': [],
    'geolocation': [],
    'payment': [],
    'usb': [],
    'bluetooth': [],
    'accelerometer': [],
    'gyroscope': [],
    'magnetometer': [],
    'fullscreen': ['self']
  },
  
  crossOriginEmbedderPolicy: 'unsafe-none',
  crossOriginOpenerPolicy: 'same-origin-allow-popups',
  crossOriginResourcePolicy: 'same-origin'
}

export class SecurityHeadersManager {
  private config: SecurityHeadersConfig

  constructor(config: Partial<SecurityHeadersConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Apply security headers to NextResponse
   */
  applyHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const headers = this.generateSecurityHeaders(request)
    
    // Apply each header to the response
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value)
      }
    })

    return response
  }

  /**
   * Generate all security headers
   */
  generateSecurityHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {}
    const isProduction = process.env.NODE_ENV === 'production'
    const isHttps = request.url.startsWith('https://') || 
                   request.headers.get('x-forwarded-proto') === 'https'

    // Content Security Policy
    if (this.config.csp?.enabled) {
      const csp = this.generateCSP()
      const headerName = this.config.csp.reportOnly ? 
        'Content-Security-Policy-Report-Only' : 
        'Content-Security-Policy'
      headers[headerName] = csp
    }

    // HTTP Strict Transport Security (HTTPS only)
    if (this.config.hsts?.enabled && (isHttps || isProduction)) {
      headers['Strict-Transport-Security'] = this.generateHSTS()
    }

    // X-Frame-Options
    if (this.config.frameOptions) {
      headers['X-Frame-Options'] = this.config.frameOptions
    }

    // X-Content-Type-Options
    if (this.config.contentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff'
    }

    // Referrer Policy
    if (this.config.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy
    }

    // Permissions Policy
    if (this.config.permissionsPolicy) {
      headers['Permissions-Policy'] = this.generatePermissionsPolicy()
    }

    // Cross-Origin headers
    if (this.config.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy
    }

    if (this.config.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy
    }

    if (this.config.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy
    }

    // Additional security headers
    headers['X-XSS-Protection'] = '1; mode=block'
    headers['X-DNS-Prefetch-Control'] = 'off'
    headers['X-Download-Options'] = 'noopen'
    headers['X-Permitted-Cross-Domain-Policies'] = 'none'

    // Remove potentially sensitive headers
    headers['Server'] = ''
    headers['X-Powered-By'] = ''

    return headers
  }

  /**
   * Generate Content Security Policy string
   */
  private generateCSP(): string {
    if (!this.config.csp?.directives) return ''
    
    const directives = this.config.csp.directives
    const cspParts: string[] = []

    Object.entries(directives).forEach(([directive, sources]) => {
      if (sources && sources.length > 0) {
        cspParts.push(`${directive} ${sources.join(' ')}`)
      }
    })

    return cspParts.join('; ')
  }

  /**
   * Generate HTTP Strict Transport Security string
   */
  private generateHSTS(): string {
    const hsts = this.config.hsts!
    let hstsValue = `max-age=${hsts.maxAge || 31536000}`
    
    if (hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains'
    }
    
    if (hsts.preload) {
      hstsValue += '; preload'
    }
    
    return hstsValue
  }

  /**
   * Generate Permissions Policy string
   */
  private generatePermissionsPolicy(): string {
    if (!this.config.permissionsPolicy) return ''
    
    const policies: string[] = []
    
    Object.entries(this.config.permissionsPolicy).forEach(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        policies.push(`${feature}=()`)
      } else {
        const sources = allowlist.map(source => 
          source === 'self' ? 'self' : `"${source}"`
        ).join(' ')
        policies.push(`${feature}=(${sources})`)
      }
    })
    
    return policies.join(', ')
  }

  /**
   * Update CSP for specific route patterns
   */
  updateCSPForRoute(pathname: string): void {
    // API routes might need different CSP
    if (pathname.startsWith('/api/')) {
      // More restrictive CSP for API endpoints
      if (this.config.csp?.directives) {
        this.config.csp.directives['script-src'] = ["'none'"]
        this.config.csp.directives['style-src'] = ["'none'"]
        this.config.csp.directives['img-src'] = ["'none'"]
      }
    }
    
    // Admin routes need stricter security
    if (pathname.startsWith('/admin/')) {
      if (this.config.csp?.directives) {
        this.config.csp.directives['script-src'] = [
          "'self'",
          'https://cdn.vercel-insights.com'
        ]
      }
    }
  }

  /**
   * Validate security headers configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Validate HSTS configuration
    if (this.config.hsts?.enabled && this.config.hsts.maxAge && this.config.hsts.maxAge < 300) {
      errors.push('HSTS max-age should be at least 300 seconds')
    }
    
    // Validate CSP directives
    if (this.config.csp?.enabled && this.config.csp.directives) {
      const requiredDirectives = ['default-src', 'script-src', 'style-src']
      requiredDirectives.forEach(directive => {
        if (!this.config.csp!.directives![directive]) {
          errors.push(`Missing required CSP directive: ${directive}`)
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * Security headers middleware for Next.js
 */
export function securityHeadersMiddleware(
  request: NextRequest,
  config: Partial<SecurityHeadersConfig> = {}
): { response: NextResponse; applied: boolean } {
  const manager = new SecurityHeadersManager(config)
  const pathname = new URL(request.url).pathname
  
  // Skip security headers for certain paths if needed
  const skipPaths = ['/api/webhooks/', '/_next/static/']
  const shouldSkip = skipPaths.some(path => pathname.startsWith(path))
  
  if (shouldSkip) {
    return {
      response: NextResponse.next(),
      applied: false
    }
  }
  
  // Update CSP based on route
  manager.updateCSPForRoute(pathname)
  
  // Create response with security headers
  const response = NextResponse.next()
  manager.applyHeaders(response, request)
  
  return {
    response,
    applied: true
  }
}

// Export configured security manager for use in middleware
export const securityManager = new SecurityHeadersManager()

// Export production-ready configuration
export const productionSecurityConfig: SecurityHeadersConfig = {
  ...DEFAULT_CONFIG,
  csp: {
    enabled: true,
    directives: {
      ...DEFAULT_CONFIG.csp!.directives,
      'script-src': [
        "'self'",
        'https://cdn.vercel-insights.com',
        'https://va.vercel-scripts.com',
        'https://www.googletagmanager.com',
        'https://js.sentry-cdn.com'
      ]
    },
    reportOnly: false
  }
}