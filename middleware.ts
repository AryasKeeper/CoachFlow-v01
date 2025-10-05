/**
 * Next.js Middleware - Production Security & Rate Limiting
 * Integrates comprehensive security headers and rate limiting for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitMiddleware } from './lib/middleware/rate-limiting'
import { securityHeadersMiddleware, productionSecurityConfig } from './lib/middleware/security-headers'
import { authProtectionMiddleware } from './lib/middleware/auth-protection'

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url)

  // CRITICAL: Skip middleware for Next.js internal routes BEFORE any auth checks
  // This must run FIRST to prevent 401 errors on chunk files
  if (
    pathname.startsWith('/_next/') ||  // Skip ALL Next.js internal routes (chunks, static, data)
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/robots.txt')
  ) {
    return NextResponse.next()
  }

  // Check authentication for protected routes (after skip checks)
  const authResult = await authProtectionMiddleware(request)

  // If auth middleware returned a redirect, use it immediately
  if (authResult.status === 307 || authResult.status === 302 || authResult.status === 301) {
    return authResult
  }

  // PERFORMANCE OPTIMIZATION: Skip heavy middleware in development
  if (process.env.NODE_ENV !== 'production') {
    // Apply minimal security headers to the auth result
    authResult.headers.set('X-Content-Type-Options', 'nosniff')
    authResult.headers.set('X-Frame-Options', 'DENY')
    return authResult
  }

  try {
    // 1. Apply rate limiting first (PRODUCTION ONLY)
    const rateLimitResult = await rateLimitMiddleware(request)

    if (!rateLimitResult.allowed) {
      // Rate limit exceeded - return rate limit response with security headers
      const { response } = securityHeadersMiddleware(request, productionSecurityConfig)

      // Merge rate limit response with security headers
      if (rateLimitResult.response) {
        const secureRateLimitResponse = rateLimitResult.response.clone()

        // Apply security headers to rate limit response
        const tempResponse = NextResponse.next()
        const securityResult = securityHeadersMiddleware(request, productionSecurityConfig)

        // Copy security headers to rate limit response
        securityResult.response.headers.forEach((value, key) => {
          if (key.toLowerCase().startsWith('x-') ||
              key.toLowerCase().includes('security') ||
              key.toLowerCase().includes('csp') ||
              key.toLowerCase().includes('hsts')) {
            secureRateLimitResponse.headers.set(key, value)
          }
        })

        return secureRateLimitResponse
      }
    }

    // 2. Apply security headers to the auth result (CSP disabled for deployment)
    const config = {
      ...productionSecurityConfig,
      csp: { enabled: false }  // Disabled to allow Next.js inline scripts
    }

    // Apply security headers to the auth result response
    let response = authResult
    const securityResult = securityHeadersMiddleware(request, config)

    // Copy security headers to the auth result
    securityResult.response.headers.forEach((value, key) => {
      response.headers.set(key, value)
    })

    // 3. Add rate limit headers if available
    if (rateLimitResult.headers && rateLimitResult.allowed) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }

    // 4. Add additional production headers based on environment
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('X-Environment', 'production')
      response.headers.set('X-Version', process.env.npm_package_version || '1.0.0')
    } else {
      response.headers.set('X-Environment', 'development')
    }

    // 5. Special handling for API routes
    if (pathname.startsWith('/api/')) {
      return handleAPIRoute(request, response, pathname)
    }

    // 6. Special handling for auth routes (additional security)
    if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
      return handleAuthRoute(request, response, pathname)
    }

    // 7. Special handling for admin routes (maximum security)
    if (pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
      return handleAdminRoute(request, response, pathname)
    }

    return response

  } catch (error) {
    // Log error but don't fail the request
    console.error('Middleware error:', error)
    
    // Apply basic security headers even if middleware fails
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }
}

/**
 * Enhanced security for API routes
 */
function handleAPIRoute(
  request: NextRequest, 
  response: NextResponse, 
  pathname: string
): NextResponse {
  // More restrictive CSP for API routes
  response.headers.set('Content-Security-Policy', "default-src 'none'")
  
  // Prevent caching of sensitive API responses
  if (pathname.includes('/auth/') || pathname.includes('/admin/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
  }
  
  // CORS headers for API routes
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'https://coachflow.com',
    'https://www.coachflow.com',
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean)
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Max-Age', '86400')
  }
  
  return response
}

/**
 * Enhanced security for authentication routes
 */
function handleAuthRoute(
  request: NextRequest, 
  response: NextResponse, 
  pathname: string
): NextResponse {
  // CSP disabled for auth pages to allow Next.js inline scripts
  // TODO: Re-enable with nonce-based CSP for better security
  // response.headers.set('Content-Security-Policy',
  //   "default-src 'self'; " +
  //   "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://va.vercel-scripts.com; " +
  //   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  //   "font-src 'self' https://fonts.gstatic.com; " +
  //   "img-src 'self' data:; " +
  //   "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
  //   "form-action 'self'"
  // )
  
  // Prevent caching of auth pages and API responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  // Additional auth security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"')
  
  return response
}

/**
 * Maximum security for admin routes
 */
function handleAdminRoute(
  request: NextRequest, 
  response: NextResponse, 
  pathname: string
): NextResponse {
  // Most restrictive CSP for admin routes
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "object-src 'none'"
  )
  
  // No caching for admin routes
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')
  
  // Additional admin security
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive')
  response.headers.set('X-Admin-Route', 'true')
  
  return response
}

// Configure which paths the middleware should run on
// ULTRA SIMPLIFIED: Allowlist approach instead of blocklist to avoid Vercel Edge Runtime issues
export const config = {
  matcher: [
    /*
     * Only run on specific paths - explicit allowlist
     * This avoids any issues with negative lookahead patterns on Vercel Edge
     */
    '/',
    '/auth/:path*',
    '/coach/:path*',
    '/org/:path*',
    '/admin/:path*',
    '/how-it-works',
    '/pricing',
    '/api/:path*'
  ]
}