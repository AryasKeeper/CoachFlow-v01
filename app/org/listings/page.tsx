import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ListingCard } from "@/components/ui/listing-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, ClipboardList } from "lucide-react"

export default async function OrgListingsPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()
  
  // Get all listings for this organization
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      applications(count)
    `)
    .eq('org_id', user.id)
    .order('created_at', { ascending: false })
  
  const activeListings = listings?.filter(l => l.status === 'active') || []
  const inactiveListings = listings?.filter(l => l.status !== 'active') || []
  
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
      
      {listings && listings.length > 0 ? (
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
        <EmptyState
          icon={ClipboardList}
          title="No listings yet"
          description="Post your first coaching need to start receiving applications from verified coaches"
          action={{
            label: "Post Your First Need",
            onClick: () => window.location.href = '/org/post'
          }}
        />
      )}
    </div>
  )
}
