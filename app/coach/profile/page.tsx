import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CoachProfileClient } from "./profile-client"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CoachProfileViewPage() {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()

  // Get coach's own profile
  const { data: coach } = await supabase
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      coach_profiles!inner(
        bio,
        gender,
        specialties,
        suburbs,
        rate_hourly,
        rate_flat,
        travel_km,
        years_experience,
        coaching_philosophy,
        achievements,
        wwcc_number,
        insurance_url,
        first_aid_url,
        rating_avg,
        rating_count,
        phone_number,
        preferred_contact_method,
        contact_availability,
        linkedin_url
      )
    `)
    .eq('id', user.id)
    .single()

  return <CoachProfileClient initialData={coach} />
}