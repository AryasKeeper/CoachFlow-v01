"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useListings, useCoachApplications, useCoachProfile } from "@/lib/react-query/hooks/use-listings"
import { AnimatedListingCard } from "@/components/ui/animated-listing-card"
import { EmptyState } from "@/components/ui/empty-state"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton-shimmer"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/date-utils"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/lib/hooks/use-user"
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  ClipboardList,
  Grid3x3,
  List,
  Map as MapIcon,
  ChevronRight,
  Clock,
  Users,
  Building2,
  AlertCircle,
  RefreshCw
} from "lucide-react"

// Dynamically import map component
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

export default function ReactQueryListingsPage() {
  const router = useRouter()
  const { user } = useUser()

  // React Query hooks
  const { data: listings = [], isLoading: listingsLoading, error: listingsError, refetch } = useListings()
  const { data: profile, isLoading: profileLoading } = useCoachProfile(user?.id)
  const { data: applications = [], isLoading: applicationsLoading } = useCoachApplications(user?.id)

  // View and filter states
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [payFilter, setPayFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const isLoading = listingsLoading || profileLoading || applicationsLoading
  const appliedListingIds = applications?.map(app => app.listing_id) || []

  // Filter listings
  const filteredListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      // Skip already applied
      if (appliedListingIds.includes(listing.id)) return false

      // Gender preference filter
      if (listing.gender_preference && listing.gender_preference !== 'no-preference' && profile?.gender) {
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
        listing.location?.toLowerCase().includes(query)
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

  // View Toggle with animation
  const ViewToggle = () => (
    <motion.div
      className="inline-flex items-center bg-muted/50 rounded-lg p-1"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {(['card', 'list', 'map'] as ViewMode[]).map((mode) => (
        <Button
          key={mode}
          variant={viewMode === mode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode(mode)}
          className={cn(
            "gap-2 transition-all",
            viewMode === mode && "shadow-sm"
          )}
        >
          {mode === 'card' && <Grid3x3 className="w-4 h-4" />}
          {mode === 'list' && <List className="w-4 h-4" />}
          {mode === 'map' && <MapIcon className="w-4 h-4" />}
          <span className="hidden sm:inline">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
        </Button>
      ))}
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" shimmer />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (listingsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Listings</h2>
          <p className="text-muted-foreground mb-4">Failed to load listings. Please try again.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Coaching Opportunities</h1>
          <p className="text-muted-foreground">
            {filteredListings.length} jobs available in Sydney
          </p>
        </div>
        <ViewToggle />
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
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
      </motion.div>

      {/* Stats Cards with animations */}
      {viewMode !== 'map' && (
        <motion.div
          className="grid md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: "Total Jobs", value: filteredListings.length, icon: ClipboardList, color: "text-muted-foreground" },
            { label: "In Your Area", value: categorizedListings.nearby.length, icon: MapPin, color: "text-blue-600" },
            { label: "Urgent", value: categorizedListings.urgent.length, icon: AlertCircle, color: "text-red-600" },
            { label: "Applied", value: appliedListingIds.length, icon: Users, color: "text-green-600" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold animate-[scale-in_0.3s_ease-out]">{stat.value}</p>
                  </div>
                  <stat.icon className={cn("w-8 h-8", stat.color)} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Content based on view mode */}
      <AnimatePresence mode="wait">
        {filteredListings.length > 0 ? (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'card' && (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredListings.map((listing, index) => (
                  <AnimatedListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => router.push(`/coach/listings/${listing.id}`)}
                    index={index}
                  />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <GlassCard className="overflow-hidden">
                {/* List view implementation */}
                <div className="divide-y">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/coach/listings/${listing.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{listing.title}</h3>
                          <p className="text-sm text-muted-foreground">{listing.location}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {viewMode === 'map' && (
              <MapView
                listings={filteredListings}
                onListingClick={(id) => router.push(`/coach/listings/${id}`)}
                userLocation={profile?.suburbs?.[0]}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <EmptyState
              icon={ClipboardList}
              title="No jobs found"
              description="Try adjusting your search filters or check back later for new opportunities"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}