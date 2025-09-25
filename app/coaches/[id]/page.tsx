import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { BadgeRow } from "@/components/ui/badge-row"
import {
  User,
  MapPin,
  Calendar,
  Award,
  DollarSign,
  Car,
  Shield,
  Star
} from "lucide-react"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CoachPublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Get coach profile (public information only)
  const { data: coach } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      role,
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
        rating_count
      )
    `)
    .eq('id', id)
    .eq('role', 'coach')
    .single()

  if (!coach) {
    notFound()
  }

  const profile = coach.coach_profiles

  const verificationBadges = [
    {
      label: "WWCC",
      status: profile?.wwcc_number ? "verified" as const : "not-provided" as const
    },
    {
      label: "Insurance",
      status: profile?.insurance_url ? "verified" as const : "not-provided" as const
    },
    {
      label: "First Aid",
      status: profile?.first_aid_url ? "verified" as const : "not-provided" as const
    },
  ]

  // Only WWCC is required for verified status - First Aid and Insurance are optional enhancements
  const isVerified = !!(profile?.wwcc_number)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <GlassCard className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {coach.first_name} {coach.last_name}
              </h1>
              <div className="flex items-center gap-3 mb-3">
                {isVerified && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Coach
                  </Badge>
                )}
                {profile?.years_experience && profile.years_experience > 0 && (
                  <Badge variant="secondary">
                    {profile.years_experience} years experience
                  </Badge>
                )}
              </div>
              {profile?.rating_avg && profile.rating_count > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{profile.rating_avg.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({profile.rating_count} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* About */}
      {(profile?.bio || profile?.coaching_philosophy) && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          {profile.bio && (
            <p className="text-muted-foreground mb-4">{profile.bio}</p>
          )}
          {profile.coaching_philosophy && (
            <div>
              <h3 className="font-medium mb-2">Coaching Philosophy</h3>
              <p className="text-muted-foreground">{profile.coaching_philosophy}</p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Specializations */}
      {profile?.specialties && profile.specialties.length > 0 && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Specializations</h2>
          <div className="flex flex-wrap gap-2">
            {profile.specialties.map((specialty: string) => (
              <Badge key={specialty} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Service Areas & Rates */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Service Areas */}
        {profile?.suburbs && profile.suburbs.length > 0 && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Service Areas
            </h3>
            <div className="space-y-1">
              {profile.suburbs.slice(0, 5).map((suburb: string) => (
                <div key={suburb} className="text-sm text-muted-foreground">
                  {suburb}
                </div>
              ))}
              {profile.suburbs.length > 5 && (
                <div className="text-sm text-muted-foreground">
                  +{profile.suburbs.length - 5} more areas
                </div>
              )}
            </div>
            {profile.travel_km && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Travels up to {profile.travel_km}km
                </span>
              </div>
            )}
          </GlassCard>
        )}

        {/* Rates */}
        {(profile?.rate_hourly || profile?.rate_flat) && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Rates
            </h3>
            <div className="space-y-2">
              {profile.rate_hourly && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">${profile.rate_hourly}/hr</span>
                </div>
              )}
              {profile.rate_flat && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Session Rate</span>
                  <span className="font-medium">${profile.rate_flat}</span>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Achievements */}
      {profile?.achievements && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Achievements
          </h2>
          <p className="text-muted-foreground">{profile.achievements}</p>
        </GlassCard>
      )}

      {/* Verifications */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Verifications</h2>
        <BadgeRow badges={verificationBadges} />
      </GlassCard>

      {/* Contact Note */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          Contact information is only available after accepting an application
        </p>
      </div>
    </div>
  )
}