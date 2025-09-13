import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ListingCard } from "@/components/ui/listing-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, ClipboardList } from "lucide-react"
import { redirect } from "next/navigation"

export default async function OrgListingsPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()
  
  // CRITICAL SECURITY CHECK: Validate user role and ID
  if (!user || !user.id || user.role !== 'org') {
    console.error('🚨 SECURITY ALERT - Invalid user accessing org listings:', {
      user_id: user?.id,
      user_role: user?.role,
      timestamp: new Date().toISOString()
    })
    redirect('/auth/sign-in')
  }
  
  // DEBUG: Log current user details
  console.log('🚨 SECURITY - Current authenticated user accessing org listings:', {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    timestamp: new Date().toISOString()
  })

  // SECURITY: Get listings with explicit user validation  
  const { data: listings, error } = await supabase
    .from('listings')
    .select(`
      *,
      applications(count)
    `)
    .eq('org_id', user.id)  // Explicit match against current user
    .order('created_at', { ascending: false })
    
  // SECURITY: Additional validation - verify all returned listings belong to current user
  let validListings = listings
  if (listings && listings.length > 0) {
    const invalidListings = listings.filter(listing => listing.org_id !== user.id)
    if (invalidListings.length > 0) {
      console.error('🚨 CRITICAL SECURITY BREACH - User received listings they don\'t own:', {
        user_id: user.id,
        user_email: user.email,
        invalid_listings: invalidListings.map(l => ({
          id: l.id,
          title: l.title,
          org_id: l.org_id,
          actual_owner: l.org_id
        })),
        timestamp: new Date().toISOString()
      })
      // Filter out invalid listings as a security measure
      validListings = listings.filter(listing => listing.org_id === user.id)
      console.log('🔒 SECURITY - Filtered out invalid listings, returning only valid ones')
    }
  }
    
  // DEBUG: Log query results
  console.log('🔍 DEBUG - Listings query result:', {
    userId: user.id,
    originalCount: listings?.length || 0,
    validCount: validListings?.length || 0,
    validListings: validListings?.map(l => ({ id: l.id, title: l.title, org_id: l.org_id })),
    error
  })
  
  const activeListings = validListings?.filter(l => l.status === 'active') || []
  const inactiveListings = validListings?.filter(l => l.status !== 'active') || []
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Listings</h1>
          <p className="text-muted-foreground">
            Manage your coaching needs and review applications
          </p>
        </div>
        <Button asChild>
          <Link href="/org/post">
            <Plus className="w-4 h-4 mr-2" />
            Post New Need
          </Link>
        </Button>
      </div>
      
      {validListings && validListings.length > 0 ? (
        <div className="space-y-8">
          {/* Active Listings */}
          {activeListings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Active Listings</h2>
                <Badge>{activeListings.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {activeListings.map((listing) => (
                  <Link key={listing.id} href={`/org/listings/${listing.id}`}>
                    <ListingCard listing={listing} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Inactive Listings */}
          {inactiveListings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Inactive Listings</h2>
                <Badge variant="secondary">{inactiveListings.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-6 opacity-75">
                {inactiveListings.map((listing) => (
                  <Link key={listing.id} href={`/org/listings/${listing.id}`}>
                    <ListingCard listing={listing} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <EmptyState
            icon={ClipboardList}
            title="No listings yet"
            description="Post your first coaching need to start receiving applications from verified coaches"
          />
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/org/post">
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Need
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
