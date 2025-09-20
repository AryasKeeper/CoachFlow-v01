/**
 * Authentication Protection Middleware
 * Ensures protected routes are only accessible by authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Define protected route patterns
const PROTECTED_ROUTES = [
  '/org',
  '/coach',
  '/dashboard',
  '/profile',
  '/settings',
  '/bookings',
  '/applications',
  '/listings'
]

// Routes that should redirect to role-specific dashboards when authenticated
const AUTH_ROUTES = [
  '/auth/sign-in',
  '/auth/sign-up'
]

export async function authProtectionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    // Create a Supabase client for server-side auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // We can't set cookies in middleware, so we'll skip this
          },
          remove(name: string, options: any) {
            // We can't remove cookies in middleware, so we'll skip this
          }
        }
      }
    )

    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession()

    // Check if the current path is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

    // If accessing a protected route without authentication, redirect to sign-in
    if (isProtectedRoute && !session) {
      console.log(`Unauthorized access to ${pathname}, redirecting to sign-in`)
      const signInUrl = new URL('/auth/sign-in', request.url)

      // Add the original URL as a redirect parameter
      signInUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(signInUrl)
    }

    // If accessing auth routes while already authenticated, redirect to appropriate dashboard
    if (isAuthRoute && session) {
      // Get user role from database to determine redirect
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const dashboardUrl = userData?.role === 'coach'
        ? '/coach/dashboard'
        : '/org/dashboard'

      console.log(`Already authenticated, redirecting from ${pathname} to ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // For all other cases, continue with the request
    return NextResponse.next()

  } catch (error) {
    console.error('Auth middleware error:', error)

    // On error, be conservative and protect the route
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

    if (isProtectedRoute) {
      const signInUrl = new URL('/auth/sign-in', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  }
}