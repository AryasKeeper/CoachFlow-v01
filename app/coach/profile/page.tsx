import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CoachProfileClient } from "./profile-client"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CoachProfileViewPage() {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()

  // First try to get user data from users table
  const { data: userData } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', user.id)
    .maybeSingle()

  // Then get the coach profile - use maybeSingle() to handle non-existent profile
  const { data: profileData } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()


  // Combine the data - use auth user data if users table doesn't have a record
  const coach = {
    id: user.id,
    email: userData?.email || user.email || '',
    first_name: userData?.first_name || '',
    last_name: userData?.last_name || '',
    coach_profiles: profileData || null
  }

  return <CoachProfileClient initialData={coach} />
}