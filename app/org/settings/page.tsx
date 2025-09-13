import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Settings } from "lucide-react"
import { SettingsForm } from "./settings-form"

export default async function OrgSettingsPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()
  
  // Fetch existing org profile
  const { data: profile } = await supabase
    .from('org_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Organization Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your organization profile and preferences
        </p>
      </div>

      <SettingsForm 
        userEmail={user.email}
        userId={user.id}
        existingProfile={profile}
      />
    </div>
  )
}