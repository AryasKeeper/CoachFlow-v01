import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { OrgProfileForm } from "./org-profile-form"

export default async function OrgProfilePage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()

  // Get existing org profile
  const { data: profile } = await supabase
    .from('org_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get user details
  const { data: userDetails } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Organization Profile</h1>
          <p className="text-muted-foreground">
            Create a compelling profile to attract the best coaching talent
          </p>
        </div>

        <OrgProfileForm
          userId={user.id}
          userEmail={userDetails?.email || user.email}
          initialData={profile}
        />
      </div>
    </div>
  )
}