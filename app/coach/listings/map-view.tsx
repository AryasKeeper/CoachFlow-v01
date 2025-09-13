"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/date-utils"
import {
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  ChevronRight,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react"

// Fix for default markers in Leaflet
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"

// Sydney coordinates
const SYDNEY_CENTER = { lat: -33.8688, lng: 151.2093 }
const DEFAULT_ZOOM = 11

// Custom marker icons
const createCustomIcon = (color: string, isUrgent: boolean = false) => {
  const markerHtml = `
    <div class="relative">
      <div class="absolute -top-1 -right-1 ${isUrgent ? 'block' : 'hidden'}">
        <span class="flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </div>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2C12.8 2 7 7.8 7 15C7 24.5 20 38 20 38C20 38 33 24.5 33 15C33 7.8 27.2 2 20 2Z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="15" r="5" fill="white"/>
      </svg>
    </div>
  `

  return L.divIcon({
    html: markerHtml,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  })
}

// Map control component
function MapControls({ onCenterUser }: { onCenterUser: () => void }) {
  const map = useMap()

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        size="icon"
        variant="outline"
        className="bg-white shadow-md hover:shadow-lg"
        onClick={() => map.zoomIn()}
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="bg-white shadow-md hover:shadow-lg"
        onClick={() => map.zoomOut()}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="bg-white shadow-md hover:shadow-lg"
        onClick={onCenterUser}
      >
        <Navigation className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="bg-white shadow-md hover:shadow-lg"
        onClick={() => {
          map.setView(SYDNEY_CENTER, DEFAULT_ZOOM)
        }}
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

interface MapViewProps {
  listings: any[]
  onListingClick: (id: string) => void
  userLocation?: string
}

// Helper to geocode Sydney suburbs (simplified - in production use a proper geocoding service)
const SUBURB_COORDINATES: Record<string, [number, number]> = {
  "Sydney CBD": [-33.8688, 151.2093],
  "Bondi": [-33.8915, 151.2767],
  "Manly": [-33.7969, 151.2863],
  "Parramatta": [-33.8151, 151.0011],
  "Chatswood": [-33.7969, 151.1834],
  "Cronulla": [-34.0548, 151.1517],
  "Penrith": [-33.7508, 150.6910],
  "Liverpool": [-33.9206, 150.9231],
  "Blacktown": [-33.7692, 150.9051],
  "Castle Hill": [-33.7301, 151.0011],
  "Hurstville": [-33.9667, 151.1000],
  "Bankstown": [-33.9180, 151.0351],
  "Sutherland": [-34.0313, 151.0572],
  "Hornsby": [-33.7047, 151.0984],
  "Ryde": [-33.8151, 151.1041],
  "Strathfield": [-33.8731, 151.0932],
  "Burwood": [-33.8774, 151.1037],
  "Randwick": [-33.9133, 151.2419],
  "Maroubra": [-33.9500, 151.2436],
  "Coogee": [-33.9211, 151.2551]
}

function getCoordinatesForLocation(location: string): [number, number] {
  // Try to match suburb name in location string
  for (const [suburb, coords] of Object.entries(SUBURB_COORDINATES)) {
    if (location?.toLowerCase().includes(suburb.toLowerCase())) {
      return coords
    }
  }

  // Default to Sydney CBD with small random offset to avoid exact overlap
  return [
    SYDNEY_CENTER.lat + (Math.random() - 0.5) * 0.1,
    SYDNEY_CENTER.lng + (Math.random() - 0.5) * 0.1
  ]
}

export function MapView({ listings, onListingClick, userLocation }: MapViewProps) {
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.log("Location access denied:", error)
          // Fallback to user's suburb if available
          if (userLocation) {
            const coords = getCoordinatesForLocation(userLocation)
            setUserCoords(coords)
          }
        }
      )
    }
  }, [userLocation])

  const centerOnUser = () => {
    if (userCoords && mapRef.current) {
      mapRef.current.setView(userCoords, 13)
    }
  }

  // Prepare markers with coordinates
  const markers = listings.map(listing => {
    const coords = getCoordinatesForLocation(listing.location)
    return {
      ...listing,
      coordinates: coords
    }
  })

  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={SYDNEY_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapControls onCenterUser={centerOnUser} />

        {/* User location marker */}
        {userCoords && (
          <Marker
            position={userCoords}
            icon={L.divIcon({
              html: `
                <div class="relative">
                  <div class="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping"></div>
                  <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
                </div>
              `,
              className: 'user-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="text-sm font-medium">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Listing markers with clustering */}
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          maxClusterRadius={50}
        >
          {markers.map((listing) => (
            <Marker
              key={listing.id}
              position={listing.coordinates}
              icon={createCustomIcon(
                listing.urgency === 'urgent' ? '#ef4444' : '#3b82f6',
                listing.urgency === 'urgent'
              )}
            >
              <Popup maxWidth={300} className="custom-popup">
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-2">{listing.title}</h3>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span>{listing.org?.org_profiles?.org_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{listing.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(listing.dates?.[0] || listing.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-green-600">{listing.pay_details}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {listing.urgency === 'urgent' && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                      {listing.type && (
                        <Badge variant="secondary" className="text-xs">{listing.type}</Badge>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => onListingClick(listing.id)}
                      className="gap-1"
                    >
                      View
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
        <div className="text-xs font-medium mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Urgent Jobs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Regular Jobs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200"></div>
            <span className="text-xs">Your Location</span>
          </div>
        </div>
      </div>
    </div>
  )
}