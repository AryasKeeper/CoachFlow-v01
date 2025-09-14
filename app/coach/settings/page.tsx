import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { SettingsLayout } from "./settings-layout"

export default async function CoachSettingsPage() {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()

  // Fetch user data
  const [{ data: userData }, { data: profile }] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('coach_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
  ])

  return (
    <SettingsLayout
      user={user}
      userData={userData}
      profile={profile}
    />
  )
}