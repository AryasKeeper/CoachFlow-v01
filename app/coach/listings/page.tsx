"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { ListingCard } from "@/components/ui/listing-card"
import { EmptyState } from "@/components/ui/empty-state"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/date-utils"
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Filter,
  ClipboardList,
  Grid3x3,
  List,
  Map,
  ChevronRight,
  Clock,
  Users,
  Building2,
  AlertCircle
} from "lucide-react"

// Dynamically import map component to avoid SSR issues
const MapView = dynamic(
  () => import("./map-view").then(mod => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full bg-muted/20 rounded-lg animate-pulse flex items-center justify-center">
        <MapPin className="w-12 h-12 text-muted-foreground animate-bounce" />
      </div>
    )
  }
)

type ViewMode = 'card' | 'list' | 'map'

export default function EnhancedCoachListingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [existingApplications, setExistingApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // View and filter states
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [payFilter, setPayFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/auth/sign-in')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (userData?.role !== 'coach') {
          router.push('/')
          return
        }

        setUser(currentUser)

        const { data: profileData } = await supabase
          .from('coach_profiles')
          .select('wwcc_number, insurance_url, first_aid_url, suburbs, gender')
          .eq('user_id', currentUser.id)
          .single()

        setProfile(profileData)

        const { data: listingsData } = await supabase
          .from('listings')
          .select(`
            *,
            org:users!listings_org_id_fkey(
              org_profiles!inner(
                org_name,
                location
              )
            ),
            applications!inner(count)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        const { data: applicationsData } = await supabase
          .from('applications')
          .select('listing_id')
          .eq('coach_id', currentUser.id)

        setListings(listingsData || [])
        setExistingApplications(applicationsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  const isVerified = profile?.wwcc_number && profile?.insurance_url && profile?.first_aid_url
  const appliedListingIds = existingApplications?.map(app => app.listing_id) || []

  // Filter listings
  const filteredListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      // Skip already applied
      if (appliedListingIds.includes(listing.id)) return false

      // Gender preference filter
      if (listing.gender_preference && listing.gender_preference !== 'no-preference') {
        if (!profile?.gender) return false
        if (listing.gender_preference !== profile.gender) return false
      }

      return true
    })

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(listing =>
        listing.title?.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query) ||
        listing.location?.toLowerCase().includes(query) ||
        listing.org?.org_profiles?.org_name?.toLowerCase().includes(query)
      )
    }

    // Pay filter
    if (payFilter !== 'all') {
      const minPay = parseInt(payFilter)
      filtered = filtered.filter(listing => {
        const payMatch = listing.pay_details?.match(/\$(\d+)/)
        if (payMatch) {
          return parseInt(payMatch[1]) >= minPay
        }
        return false
      })
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(listing => {
        const listingDate = new Date(listing.dates?.[0] || listing.created_at)
        switch (dateFilter) {
          case 'week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            return listingDate <= weekFromNow
          case 'month':
            const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            return listingDate <= monthFromNow
          case 'future':
            return listingDate > now
          default:
            return true
        }
      })
    }

    return filtered
  }, [listings, appliedListingIds, profile, searchQuery, payFilter, dateFilter])

  // Categorize listings
  const categorizedListings = useMemo(() => {
    const urgent = filteredListings.filter(l => l.urgency === 'urgent')
    const nearby = profile?.suburbs ? filteredListings.filter(l => {
      if (!l.suburbs || l.suburbs.length === 0) {
        return profile.suburbs.some((suburb: string) =>
          l.location?.toLowerCase().includes(suburb.toLowerCase())
        )
      }
      return profile.suburbs.some((coachSuburb: string) =>
        l.suburbs.some((listingSuburb: string) =>
          coachSuburb.toLowerCase() === listingSuburb.toLowerCase()
        )
      )
    }) : []
    const other = filteredListings.filter(l =>
      !urgent.includes(l) && !nearby.includes(l)
    )

    return { urgent, nearby, other }
  }, [filteredListings, profile])

  // View toggle button component
  const ViewToggle = () => (
    <div className="inline-flex items-center bg-muted/50 rounded-lg p-1">
      <Button
        variant={viewMode === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('card')}
        className={cn(
          "gap-2 transition-all",
          viewMode === 'card' && "shadow-sm"
        )}
      >
        <Grid3x3 className="w-4 h-4" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className={cn(
          "gap-2 transition-all",
          viewMode === 'list' && "shadow-sm"
        )}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        variant={viewMode === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('map')}
        className={cn(
          "gap-2 transition-all",
          viewMode === 'map' && "shadow-sm"
        )}
      >
        <Map className="w-4 h-4" />
        <span className="hidden sm:inline">Map</span>
      </Button>
    </div>
  )

  // List view component
  const ListView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Job Title</th>
            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground hidden md:table-cell">Organization</th>
            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground hidden lg:table-cell">Location</th>
            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Pay</th>
            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
            <th className="text-right py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {filteredListings.map((listing) => (
            <tr
              key={listing.id}
              className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/coach/listings/${listing.id}`)}
            >
              <td className="py-4 px-4">
                <div className="font-medium">{listing.title}</div>
                <div className="text-sm text-muted-foreground md:hidden">
                  {listing.org?.org_profiles?.org_name}
                </div>
              </td>
              <td className="py-4 px-4 hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{listing.org?.org_profiles?.org_name}</span>
                </div>
              </td>
              <td className="py-4 px-4 hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{listing.location}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(listing.dates?.[0] || listing.created_at)}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="font-medium text-green-600">{listing.pay_details}</span>
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-1">
                  {listing.urgency === 'urgent' && (
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  )}
                  {categorizedListings.nearby.includes(listing) && (
                    <Badge className="text-xs bg-blue-500/10 text-blue-700 border-blue-200">Nearby</Badge>
                  )}
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Coaching Opportunities</h1>
          <p className="text-muted-foreground">
            {filteredListings.length} jobs available in Sydney
          </p>
        </div>
        <ViewToggle />
      </div>

      {/* Search and Filters */}
      <GlassCard className="mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search jobs, organizations, locations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={payFilter} onValueChange={setPayFilter}>
            <SelectTrigger>
              <DollarSign className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Pay range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rates</SelectItem>
              <SelectItem value="50">$50+/hr</SelectItem>
              <SelectItem value="75">$75+/hr</SelectItem>
              <SelectItem value="100">$100+/hr</SelectItem>
              <SelectItem value="150">$150+/hr</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="future">Future dates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      {viewMode !== 'map' && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{filteredListings.length}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Your Area</p>
                <p className="text-2xl font-bold text-blue-600">{categorizedListings.nearby.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{categorizedListings.urgent.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applied</p>
                <p className="text-2xl font-bold text-green-600">{appliedListingIds.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Content based on view mode */}
      {filteredListings.length > 0 ? (
        <div className="transition-all duration-300">
          {viewMode === 'card' && (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => router.push(`/coach/listings/${listing.id}`)}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <GlassCard className="overflow-hidden">
              <ListView />
            </GlassCard>
          )}

          {viewMode === 'map' && (
            <MapView
              listings={filteredListings}
              onListingClick={(id) => router.push(`/coach/listings/${id}`)}
              userLocation={profile?.suburbs?.[0]}
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No jobs found"
          description="Try adjusting your search filters or check back later for new opportunities"
        />
      )}
    </div>
  )
}