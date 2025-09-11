"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ListingCard } from "@/components/ui/listing-card"
import { EmptyState } from "@/components/ui/empty-state"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Filter,
  ClipboardList
} from "lucide-react"

export default function CoachListingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [existingApplications, setExistingApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/auth/sign-in')
          return
        }
        
        // Check if user is a coach
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
        
        // Get coach profile for verification check
        const { data: profileData } = await supabase
          .from('coach_profiles')
          .select('wwcc_number, insurance_url, first_aid_url, suburbs')
          .eq('user_id', currentUser.id)
          .single()
        
        setProfile(profileData)
        
        // Get active listings for all coaches (verified and unverified can browse)
        const { data: listingsData } = await supabase
          .from('listings')
          .select(`
            *,
            org:users!listings_org_id_fkey(
              org_profiles!inner(
                org_name
              )
            ),
            applications!inner(count)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        // Get coach's existing applications
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
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Find Coaching Opportunities</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  // Now all coaches (verified and unverified) can browse listings
  // The apply functionality will be restricted in the detail page
  
  const appliedListingIds = existingApplications?.map(app => app.listing_id) || []
  const availableListings = listings?.filter(listing => !appliedListingIds.includes(listing.id)) || []
  
  // Categorize listings
  const urgentListings = availableListings.filter(l => l.urgency === 'urgent')
  const nearbyListings = profile?.suburbs ? availableListings.filter(l => {
    // Proper suburb matching using array intersection
    if (!l.suburbs || l.suburbs.length === 0) {
      // Fallback to location text matching for legacy listings
      return profile.suburbs.some((suburb: string) => 
        l.location.toLowerCase().includes(suburb.toLowerCase())
      )
    }
    
    // Check if any of the coach's service areas match listing suburbs
    return profile.suburbs.some((coachSuburb: string) =>
      l.suburbs.some((listingSuburb: string) =>
        coachSuburb.toLowerCase() === listingSuburb.toLowerCase()
      )
    )
  }) : []
  const otherListings = availableListings.filter(l => 
    !urgentListings.includes(l) && !nearbyListings.includes(l)
  )
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Coaching Opportunities</h1>
        <p className="text-muted-foreground">
          Browse and apply for basketball coaching jobs in Sydney
        </p>
      </div>
      
      {/* Search and Filters */}
      <GlassCard className="mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by location, organization, or keywords..."
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger>
              <DollarSign className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Pay range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rates</SelectItem>
              <SelectItem value="50">$50+/hr</SelectItem>
              <SelectItem value="75">$75+/hr</SelectItem>
              <SelectItem value="100">$100+/hr</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="all">
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
      
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Jobs</p>
              <p className="text-2xl font-bold">{availableListings.length}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Your Area</p>
              <p className="text-2xl font-bold text-blue-600">{nearbyListings.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Urgent Needs</p>
              <p className="text-2xl font-bold text-red-600">{urgentListings.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
        </GlassCard>
      </div>
      
      {availableListings.length > 0 ? (
        <div className="space-y-8">
          {/* Urgent Listings */}
          {urgentListings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Urgent Opportunities</h2>
                <Badge variant="destructive">{urgentListings.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {urgentListings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    onClick={() => router.push(`/coach/listings/${listing.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Nearby Listings */}
          {nearbyListings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">In Your Area</h2>
                <Badge>{nearbyListings.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {nearbyListings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    onClick={() => router.push(`/coach/listings/${listing.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Other Listings */}
          {otherListings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Other Opportunities</h2>
                <Badge variant="secondary">{otherListings.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {otherListings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    onClick={() => router.push(`/coach/listings/${listing.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No available opportunities"
          description="Check back soon for new coaching opportunities or adjust your search filters"
        />
      )}
    </div>
  )
}
