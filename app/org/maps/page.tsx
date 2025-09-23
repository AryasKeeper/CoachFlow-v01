import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DiscoveryMap } from "@/components/maps/discovery-map"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Award, Star } from "lucide-react"

// Sydney suburbs with approximate coordinates (for demo purposes)
const SUBURB_COORDINATES: Record<string, [number, number]> = {
  'Sydney CBD': [-33.8688, 151.2093],
  'Bondi': [-33.8915, 151.2767],
  'Manly': [-33.8000, 151.2848],
  'Parramatta': [-33.8151, 151.0011],
  'Chatswood': [-33.7969, 151.1830],
  'Cronulla': [-34.0548, 151.1517],
  'Penrith': [-33.7507, 150.6877],
  'Liverpool': [-33.9200, 150.9224],
  'Hornsby': [-33.7050, 151.0991],
  'Bankstown': [-33.9180, 151.0347],
  'Default': [-33.8688, 151.2093] // Sydney CBD as default
}

function getCoordinatesForLocation(location: string): [number, number] {
  // Try to match suburb name in the location string
  for (const [suburb, coords] of Object.entries(SUBURB_COORDINATES)) {
    if (location?.toLowerCase().includes(suburb.toLowerCase())) {
      return coords
    }
  }
  // Return Sydney CBD as default
  return SUBURB_COORDINATES['Default']
}

export default async function OrgMapsPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()

  // Get coaches with their profiles and primary locations
  const { data: coaches } = await supabase
    .from('coach_profiles')
    .select(`
      *,
      users!inner(
        id,
        name,
        email
      )
    `)
    .not('primary_suburb', 'is', null) // Only show coaches who have set their primary location

  // Transform coaches into map locations
  const locations = coaches?.map(coach => {
    const primaryLocation = coach.primary_suburb || coach.city || 'Sydney CBD'
    const coordinates = coach.primary_suburb_lat && coach.primary_suburb_lng
      ? [coach.primary_suburb_lat, coach.primary_suburb_lng] as [number, number]
      : getCoordinatesForLocation(primaryLocation)

    return {
      id: coach.user_id,
      type: 'coach' as const,
      name: `${coach.first_name} ${coach.last_name}`,
      position: coordinates,
      details: {
        ...coach,
        experience_level: coach.experience_level,
        years_experience: coach.years_experience,
        specializations: coach.specializations,
        certifications: coach.certifications,
        primary_suburb: coach.primary_suburb,
        service_radius_km: coach.service_radius_km || 20,
        availability: coach.availability,
        desired_pay_min: coach.desired_pay_min,
        desired_pay_max: coach.desired_pay_max
      }
    }
  }) || []

  // Calculate stats
  const experienceLevels = coaches?.reduce((acc, coach) => {
    const level = coach.experience_level || 'unknown'
    acc[level] = (acc[level] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const certifiedCoaches = coaches?.filter(c => c.certifications && c.certifications.length > 0).length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Discover Coaches</h1>
        <p className="text-muted-foreground">
          Find qualified coaches in your area. Click on markers to view coach profiles and availability.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{locations.length}</p>
              <p className="text-sm text-muted-foreground">Available Coaches</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certifiedCoaches}</p>
              <p className="text-sm text-muted-foreground">Certified Coaches</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {experienceLevels['expert'] || 0}
              </p>
              <p className="text-sm text-muted-foreground">Expert Coaches</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(coaches?.map(c => c.primary_suburb).filter(Boolean)).size || 0}
              </p>
              <p className="text-sm text-muted-foreground">Coverage Areas</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Map Component */}
      <DiscoveryMap
        userRole="org"
        locations={locations}
      />

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          <strong>Pro tip:</strong> Coaches show their primary location and service radius.
          Click on a coach marker to view their full profile and qualifications.
        </p>
      </div>
    </div>
  )
}