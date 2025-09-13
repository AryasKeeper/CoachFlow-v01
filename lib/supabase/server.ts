import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { env } from '@/lib/env'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  // DEBUG: Log cookie information
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(cookie => 
    cookie.name.includes('supabase') || 
    cookie.name.includes('auth') || 
    cookie.name.includes('sb-')
  )
  
  // Temporarily disabled to reduce log noise
  // console.log('🚨 CRITICAL DEBUG - Supabase Server Client Cookies:', {
  //   total_cookies: allCookies.length,
  //   auth_related_cookies: authCookies.length,
  //   auth_cookie_names: authCookies.map(c => c.name),
  //   timestamp: new Date().toISOString(),
  //   cookie_details: authCookies.map(c => ({
  //     name: c.name,
  //     value_length: c.value?.length || 0,
  //     has_value: !!c.value
  //   }))
  // })

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
