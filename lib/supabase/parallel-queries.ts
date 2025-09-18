import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Utility to run Supabase queries in parallel for better performance
 * Instead of awaiting queries sequentially, batch them together
 */
export async function parallelQueries<T extends Record<string, Promise<any>>>(
  queries: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(queries) as (keyof T)[]
  const promises = keys.map(key => queries[key])

  const results = await Promise.all(promises)

  const output = {} as { [K in keyof T]: Awaited<T[K]> }
  keys.forEach((key, index) => {
    output[key] = results[index]
  })

  return output
}

/**
 * Optimized data fetcher for dashboard/profile pages
 * Runs all queries in parallel instead of sequentially
 */
export async function fetchDashboardData(
  supabase: SupabaseClient,
  userId: string,
  role: 'coach' | 'org'
) {
  if (role === 'coach') {
    // Run all queries in parallel
    const results = await parallelQueries({
      profile: supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),

      applicationsCount: supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', userId),

      bookingsCount: supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', userId),

      availableListings: supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      recentApplications: supabase
        .from('applications')
        .select(`
          *,
          listing:listings(
            title,
            location,
            org:users!listings_org_id_fkey(
              org_profiles!inner(
                org_name
              )
            )
          )
        `)
        .eq('coach_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),

      upcomingBookings: supabase
        .from('bookings')
        .select(`
          *,
          listing:listings(
            title,
            location,
            org:users!listings_org_id_fkey(
              org_profiles!inner(
                org_name
              )
            )
          )
        `)
        .eq('coach_id', userId)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5)
    })

    return {
      profile: results.profile.data,
      stats: {
        applicationsCount: results.applicationsCount.count || 0,
        bookingsCount: results.bookingsCount.count || 0,
        availableListings: results.availableListings.count || 0
      },
      recentApplications: results.recentApplications.data || [],
      upcomingBookings: results.upcomingBookings.data || []
    }
  }

  // Organization dashboard data
  const results = await parallelQueries({
    profile: supabase
      .from('org_profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),

    activeListings: supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userId)
      .eq('status', 'active'),

    totalApplications: supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('listing_id',
        // Subquery for org's listings
        (await supabase
          .from('listings')
          .select('id')
          .eq('org_id', userId)).data?.map(l => l.id) || []
      ),

    recentListings: supabase
      .from('listings')
      .select('*')
      .eq('org_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
  })

  return {
    profile: results.profile.data,
    stats: {
      activeListings: results.activeListings.count || 0,
      totalApplications: results.totalApplications.count || 0
    },
    recentListings: results.recentListings.data || []
  }
}