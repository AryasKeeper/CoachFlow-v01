import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Users,
  Trophy,
  Target,
  Edit,
  User,
  Calendar
} from "lucide-react"

export default async function OrgProfileViewPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()

  // Get organization's profile
  const { data: org } = await supabase
    .from('org_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get active listings count
  const { count: activeListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', user.id)
    .eq('status', 'active')

  // Get total applications received - first get org's listings, then count applications
  const { data: orgListings } = await supabase
    .from('listings')
    .select('id')
    .eq('org_id', user.id)

  const listingIds = orgListings?.map(l => l.id) || []

  const { count: totalApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('listing_id', listingIds.length > 0 ? listingIds : ['-1']) // -1 ensures no match if no listings

  const hasCompleteProfile = org && org.org_name && org.contact_person_name && org.contact_email

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Edit Button */}
      <div className="flex justify-end mb-4">
        <Link href="/org/profile/edit">
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Header */}
      <GlassCard className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {org?.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.org_name || "Organization Logo"}
                className="w-20 h-20 rounded-lg object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {org?.org_name || "Organization Name"}
              </h1>
              <p className="text-muted-foreground mb-3">{user.email}</p>
              <div className="flex items-center gap-4 text-sm">
                {activeListings !== null && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{activeListings} active listings</span>
                  </div>
                )}
                {totalApplications !== null && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{totalApplications} applications received</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Contact Information (Private) */}
      <GlassCard className="mb-6 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Contact Information</h2>
          <Badge variant="outline" className="text-xs">
            Private - Shared with accepted coaches
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{org?.contact_person_name || "Not set"}</span>
              {org?.contact_person_title && (
                <Badge variant="secondary" className="text-xs">
                  {org.contact_person_title}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Contact Email</p>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{org?.contact_email || user.email}</span>
            </div>
          </div>
          {org?.contact_phone && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Contact Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{org.contact_phone}</span>
              </div>
            </div>
          )}
          {org?.website_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Website</p>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {org.website_url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* About Organization */}
      {org?.about_organization && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">About Our Organization</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{org.about_organization}</p>
        </GlassCard>
      )}

      {/* Location */}
      {(org?.address || org?.city) && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location
          </h2>
          <div className="space-y-2 text-muted-foreground">
            {org.address && <p>{org.address}</p>}
            <p>
              {[org.city, org.state, org.zip_code].filter(Boolean).join(', ')}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Culture & Programs */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {org?.team_culture && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Team Culture
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {org.team_culture}
            </p>
          </GlassCard>
        )}

        {org?.program_details && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Programs
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {org.program_details}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Facility Features */}
      {org?.facility_features && org.facility_features.length > 0 && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Facility Features</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {org.facility_features.map((feature: string) => (
              <div key={feature} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Organization Stats */}
      {org?.coaching_staff_size !== undefined && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Organization Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Coaching Staff Size</span>
              <Badge variant="secondary">
                {org.coaching_staff_size} coaches
              </Badge>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Profile Completeness */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">Profile Completeness</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {org?.org_name ? '✓' : '○'} Organization Name
          </div>
          <div className="flex items-center gap-2">
            {org?.contact_person_name ? '✓' : '○'} Contact Person
          </div>
          <div className="flex items-center gap-2">
            {org?.about_organization ? '✓' : '○'} About Organization
          </div>
          <div className="flex items-center gap-2">
            {org?.city ? '✓' : '○'} Location Details
          </div>
          <div className="flex items-center gap-2">
            {org?.facility_features?.length > 0 ? '✓' : '○'} Facility Features
          </div>
        </div>
        {!hasCompleteProfile && (
          <Link href="/org/profile/edit">
            <Button className="mt-4 w-full" variant="outline">
              Complete Your Profile
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}