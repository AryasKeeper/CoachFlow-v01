"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
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
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  ClipboardList,
  Grid3x3,
  List,
  Map,
  ChevronRight,
  Clock,
  Users,
  Building2,
  AlertCircle,
  TrendingUp
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

const viewTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }
}

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
          .select('*')
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

  const appliedListingIds = existingApplications?.map(app => app.listing_id) || []

  // Filter listings
  const filteredListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      if (appliedListingIds.includes(listing.id)) return false
      if (listing.gender_preference && listing.gender_preference !== 'no-preference' && profile?.gender) {
        if (listing.gender_preference !== profile.gender) return false
      }
      return true
    })

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(listing =>
        listing.title?.toLowerCase().includes(query) ||
        listing.description?.toLowerCase().includes(query) ||
        listing.location?.toLowerCase().includes(query)
      )
    }

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

  // Enhanced View Toggle with animations
  const ViewToggle = () => (
    <motion.div
      className="inline-flex items-center bg-muted/50 rounded-lg p-1"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
    >
      {(['card', 'list', 'map'] as ViewMode[]).map((mode) => (
        <motion.div key={mode} whileTap={{ scale: 0.95 }}>
          <Button
            variant={viewMode === mode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode(mode)}
            className={cn(
              "gap-2 transition-all relative",
              viewMode === mode && "shadow-sm"
            )}
          >
            {viewMode === mode && (
              <motion.div
                className="absolute inset-0 bg-primary rounded-md"
                layoutId="activeView"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className={cn("relative z-10", viewMode === mode && "text-primary-foreground")}>
              {mode === 'card' && <Grid3x3 className="w-4 h-4" />}
              {mode === 'list' && <List className="w-4 h-4" />}
              {mode === 'map' && <Map className="w-4 h-4" />}
            </span>
            <span className={cn("hidden sm:inline relative z-10", viewMode === mode && "text-primary-foreground")}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </span>
          </Button>
        </motion.div>
      ))}
    </motion.div>
  )

  // Enhanced List view with animations
  const ListView = () => (
    <motion.div className="overflow-x-auto" {...viewTransition}>
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
          <AnimatePresence mode="popLayout">
            {filteredListings.map((listing, index) => (
              <motion.tr
                key={listing.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/coach/listings/${listing.id}`)}
                whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
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
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Animated Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Coaching Opportunities</h1>
          <p className="text-muted-foreground">
            {filteredListings.length} jobs available in Sydney
          </p>
        </div>
        <ViewToggle />
      </motion.div>

      {/* Animated Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
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

      {/* Animated Stats Cards */}
      {viewMode !== 'map' && (
        <motion.div
          className="grid md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
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
              transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <motion.p
                      className="text-2xl font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <stat.icon className={cn("w-8 h-8", stat.color)} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Content based on view mode with animations */}
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {filteredListings.length > 0 ? (
            <motion.div key={viewMode} {...viewTransition}>
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
            </motion.div>
          ) : (
            <motion.div {...viewTransition}>
              <EmptyState
                icon={ClipboardList}
                title="No jobs found"
                description="Try adjusting your search filters or check back later for new opportunities"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}