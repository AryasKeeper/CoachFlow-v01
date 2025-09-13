import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tables } from '@/types/database'

type UserRole = Tables<'users'>['role']

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // DEBUG: Log authentication details (temporarily disabled to reduce noise)
  // console.log('🚨 CRITICAL DEBUG - Supabase Auth getUser:', {
  //   user_id: user?.id,
  //   user_email: user?.email,
  //   authError,
  //   timestamp: new Date().toISOString(),
  //   session_info: user ? 'USER_EXISTS' : 'NO_USER'
  // })
  
  if (!user) return null
  
  // Get the user's role from the users table
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
    
  // DEBUG: Log database query results (temporarily disabled to reduce noise)
  // console.log('🚨 CRITICAL DEBUG - Database query result:', {
  //   query_user_id: user.id,
  //   found_user_id: userData?.id,
  //   found_user_email: userData?.email,
  //   found_user_role: userData?.role,
  //   dbError,
  //   timestamp: new Date().toISOString(),
  //   match: user.id === userData?.id ? 'MATCH' : 'MISMATCH'
  // })
    
  return userData
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }
  
  return user
}

export async function requireRole(role: UserRole) {
  return requireAuth([role])
}

export async function redirectIfAuthenticated() {
  const user = await getUser()
  
  if (user) {
    switch (user.role) {
      case 'org':
        redirect('/org/dashboard')
      case 'coach':
        redirect('/coach/dashboard')
      case 'admin':
        redirect('/admin')
      default:
        redirect('/')
    }
  }
}
