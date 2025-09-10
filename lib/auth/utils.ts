import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tables } from '@/types/database'

type UserRole = Tables<'users'>['role']

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // Get the user's role from the users table
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
    
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
