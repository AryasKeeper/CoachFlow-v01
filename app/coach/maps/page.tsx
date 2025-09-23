import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DiscoveryMap } from "@/components/maps/discovery-map"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Calendar, DollarSign } from "lucide-react"

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

export default async function CoachMapsPage() {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()

  // Get active listings with org information for the map
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      org_profiles!inner(
        user_id,
        org_name,
        org_type,
        address,
        city,
        logo_url
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Transform listings into map locations
  const locations = listings?.map(listing => {
    const location = listing.location || listing.org_profiles?.city || 'Sydney CBD'
    const coordinates = listing.location_lat && listing.location_lng
      ? [listing.location_lat, listing.location_lng] as [number, number]
      : getCoordinatesForLocation(location)

    return {
      id: listing.id,
      type: 'listing' as const,
      name: listing.title,
      position: coordinates,
      details: {
        ...listing,
        org_name: listing.org_profiles?.org_name,
        org_type: listing.org_profiles?.org_type,
        logo_url: listing.org_profiles?.logo_url
      }
    }
  }) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Discover Opportunities</h1>
        <p className="text-muted-foreground">
          Find coaching opportunities near you. Click on markers to view details.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{locations.length}</p>
              <p className="text-sm text-muted-foreground">Active Opportunities</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(listings?.map(l => l.location)).size || 0}
              </p>
              <p className="text-sm text-muted-foreground">Locations</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {listings?.filter(l => l.urgency === 'urgent').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Urgent Positions</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${Math.round((listings?.reduce((acc, l) => acc + ((l.pay_min + l.pay_max) / 2), 0) || 0) / (listings?.length || 1))}
              </p>
              <p className="text-sm text-muted-foreground">Avg Rate/hr</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Map Component */}
      <DiscoveryMap
        userRole="coach"
        locations={locations}
      />

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Tip: Use your current location to find opportunities nearby, or search by suburb name.</p>
      </div>
    </div>
  )
}