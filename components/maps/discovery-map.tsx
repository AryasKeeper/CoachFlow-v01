'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import {
  MapPin,
  User,
  Building2,
  Search,
  Filter,
  Navigation,
  DollarSign,
  Calendar,
  Users,
  X
} from 'lucide-react'

// Import Leaflet types
import type { LatLngExpression } from 'leaflet'

// Dynamic import for Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
)

interface MapLocation {
  id: string
  type: 'coach' | 'org' | 'listing'
  name: string
  position: [number, number]
  details: any
}

interface DiscoveryMapProps {
  userRole: 'coach' | 'org'
  locations: MapLocation[]
  onLocationSelect?: (location: MapLocation) => void
}

export function DiscoveryMap({ userRole, locations, onLocationSelect }: DiscoveryMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRadius, setFilterRadius] = useState(10) // km
  const [filteredLocations, setFilteredLocations] = useState(locations)
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([-33.8688, 151.2093]) // Sydney default
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [position.coords.latitude, position.coords.longitude]
          setUserLocation(pos)
          setMapCenter(pos)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  // Filter locations based on search
  useEffect(() => {
    const filtered = locations.filter(loc => {
      if (!searchQuery) return true
      return loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             loc.details?.suburb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             loc.details?.location?.toLowerCase().includes(searchQuery.toLowerCase())
    })
    setFilteredLocations(filtered)
  }, [searchQuery, locations])

  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location)
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={userRole === 'org' ? 'Search for coaches...' : 'Search for opportunities...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={filterRadius.toString()} onValueChange={(v) => setFilterRadius(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Within 5km</SelectItem>
                <SelectItem value="10">Within 10km</SelectItem>
                <SelectItem value="20">Within 20km</SelectItem>
                <SelectItem value="50">Within 50km</SelectItem>
                <SelectItem value="100">Within 100km</SelectItem>
              </SelectContent>
            </Select>

            {userLocation && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMapCenter(userLocation)}
                title="Center on my location"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-muted-foreground">
          Found {filteredLocations.length} {userRole === 'org' ? 'coaches' : 'opportunities'} in your area
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden h-[600px]">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* User's location */}
              {userLocation && (
                <>
                  <Marker position={userLocation}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  <Circle
                    center={userLocation}
                    radius={filterRadius * 1000} // Convert km to meters
                    pathOptions={{
                      fillColor: 'blue',
                      fillOpacity: 0.1,
                      color: 'blue',
                      weight: 2
                    }}
                  />
                </>
              )}

              {/* Location markers */}
              {filteredLocations.map((location) => (
                <Marker
                  key={location.id}
                  position={location.position}
                  eventHandlers={{
                    click: () => handleLocationClick(location)
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">{location.name}</h3>
                      {location.type === 'coach' && location.details && (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            {location.details.experience_level} Coach
                          </p>
                          <Link href={`/coach/${location.id}`}>
                            <Button size="sm" className="w-full">View Profile</Button>
                          </Link>
                        </>
                      )}
                      {(location.type === 'org' || location.type === 'listing') && location.details && (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            {location.details.location}
                          </p>
                          <Link href={location.type === 'org' ? `/org/${location.id}` : `/coach/listings/${location.id}`}>
                            <Button size="sm" className="w-full">View Details</Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </GlassCard>
        </div>

        {/* List View */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {filteredLocations.length === 0 ? (
            <GlassCard>
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No {userRole === 'org' ? 'coaches' : 'opportunities'} found in this area
                </p>
              </div>
            </GlassCard>
          ) : (
            filteredLocations.map((location) => (
              <GlassCard
                key={location.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedLocation?.id === location.id ? 'border-primary' : ''
                }`}
                onClick={() => handleLocationClick(location)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {location.type === 'coach' ? (
                        <User className="w-5 h-5 text-primary" />
                      ) : (
                        <Building2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{location.name}</h3>

                      {location.type === 'coach' && location.details && (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">
                            {location.details.experience_level} Coach • {location.details.years_experience} years
                          </p>
                          {location.details.specializations && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {location.details.specializations.slice(0, 3).map((spec: string) => (
                                <Badge key={spec} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{location.details.primary_suburb}</span>
                            {location.details.service_radius_km && (
                              <span>• {location.details.service_radius_km}km radius</span>
                            )}
                          </div>
                        </>
                      )}

                      {location.type === 'listing' && location.details && (
                        <>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {location.details.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>${location.details.pay_min}-${location.details.pay_max}/hr</span>
                            </div>
                            {location.details.dates && location.details.dates.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{location.details.dates.length} dates</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {location.type === 'org' && location.details && (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">
                            {location.details.org_type}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{location.details.address || location.details.city}</span>
                          </div>
                          {location.details.active_listings > 0 && (
                            <Badge variant="default" className="mt-2 text-xs">
                              {location.details.active_listings} active listings
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  )
}