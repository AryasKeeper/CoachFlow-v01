import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CoachProfileClient } from "./profile-client"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CoachProfileViewPage() {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()

  // First get the user data
  const { data: userData } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', user.id)
    .single()

  // Then get the coach profile - use maybeSingle() to handle non-existent profile
  const { data: profileData } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Combine the data - ensure we have a valid structure even if profile doesn't exist
  const coach = userData ? {
    ...userData,
    coach_profiles: profileData || {}
  } : {
    id: user.id,
    email: user.email || '',
    first_name: '',
    last_name: '',
    coach_profiles: {}
  }

  return <CoachProfileClient initialData={coach} />
}