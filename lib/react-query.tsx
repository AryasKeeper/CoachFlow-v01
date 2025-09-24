'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Conditionally import devtools only in development
let ReactQueryDevtools: any = () => null
if (process.env.NODE_ENV === 'development') {
  ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache for 5 minutes by default
            staleTime: 5 * 60 * 1000,
            // Keep cache for 30 minutes when unused
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 3 times
            retry: 3,
            // Retry with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus for fresh data
            refetchOnWindowFocus: true,
            // Don't refetch on reconnect to save bandwidth
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

// Query key factory for consistent caching
export const queryKeys = {
  // User-related queries
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', userId] as const,
  
  // Listings queries
  listings: ['listings'] as const,
  listingsByOrg: (orgId: string) => ['listings', 'org', orgId] as const,
  listing: (id: string) => ['listings', id] as const,
  
  // Applications queries
  applications: ['applications'] as const,
  applicationsByCoach: (coachId: string) => ['applications', 'coach', coachId] as const,
  applicationsByListing: (listingId: string) => ['applications', 'listing', listingId] as const,
  
  // Bookings queries
  bookings: ['bookings'] as const,
  bookingsByUser: (userId: string) => ['bookings', 'user', userId] as const,
  
  // Messages queries  
  messages: ['messages'] as const,
  messageThread: (threadId: string) => ['messages', 'thread', threadId] as const,
} as const