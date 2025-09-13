import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BadgeRow } from "@/components/ui/badge-row"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Share2,
  Edit
} from "lucide-react"
// Removed date-fns to fix Jest worker error

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()
  
  // Get listing details
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('org_id', user.id)
    .single()
    
  if (!listing) {
    notFound()
  }
  
  // Get applications for this listing
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      coach:users!applications_coach_id_fkey(
        id,
        name,
        email,
        coach_profiles!inner(
          bio,
          specialties,
          suburbs,
          rate_hourly,
          rate_flat,
          travel_km,
          wwcc_number,
          insurance_url,
          first_aid_url,
          rating_avg,
          rating_count
        )
      )
    `)
    .eq('listing_id', listing.id)
    .order('created_at', { ascending: false })
  
  const pendingApplications = applications?.filter(a => a.status === 'pending') || []
  const acceptedApplications = applications?.filter(a => a.status === 'accepted') || []
  const rejectedApplications = applications?.filter(a => a.status === 'rejected') || []
  
  const requiredBadgesList = listing.required_badges?.map((badge: string) => ({
    label: badge.toUpperCase().replace('-', ' '),
    status: 'verified' as const
  })) || []
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/org/listings" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to listings
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                {listing.status}
              </Badge>
              {listing.urgency && (
                <Badge 
                  variant="outline"
                  className={
                    listing.urgency === 'urgent' 
                      ? 'border-red-200 text-red-700' 
                      : listing.urgency === 'soon'
                      ? 'border-orange-200 text-orange-700'
                      : ''
                  }
                >
                  {listing.urgency}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/org/listings/${listing.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Listing Details */}
        <div className="lg:col-span-2 space-y-6">
          {listing.description && (
            <GlassCard>
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </GlassCard>
          )}
          
          <GlassCard>
            <h2 className="text-lg font-semibold mb-3">Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span>{listing.location}</span>
              </div>
              
              {listing.pay_min || listing.pay_max ? (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {listing.pay_min && listing.pay_max
                      ? `$${listing.pay_min} - $${listing.pay_max}/hr`
                      : listing.pay_min
                      ? `From $${listing.pay_min}/hr`
                      : `Up to $${listing.pay_max}/hr`
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span>Rate negotiable</span>
                </div>
              )}
              
              {listing.dates && Array.isArray(listing.dates) && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Dates</p>
                    <div className="space-y-1">
                      {listing.dates.map((date: string, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {listing.timeslots && Array.isArray(listing.timeslots) && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Time Slots</p>
                    <div className="flex flex-wrap gap-2">
                      {listing.timeslots.map((slot: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
          
          {requiredBadgesList.length > 0 && (
            <GlassCard>
              <h2 className="text-lg font-semibold mb-3">Required Certifications</h2>
              <BadgeRow badges={requiredBadgesList} />
            </GlassCard>
          )}
        </div>
        
        {/* Applications Summary */}
        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4">Applications Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Applications</span>
                <span className="font-semibold">{applications?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Review</span>
                <span className="font-semibold text-orange-600">{pendingApplications.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Accepted</span>
                <span className="font-semibold text-green-600">{acceptedApplications.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rejected</span>
                <span className="font-semibold text-red-600">{rejectedApplications.length}</span>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message All Applicants
              </Button>
              <Button className="w-full" variant="outline">
                Close Listing
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
      
      {/* Applications List */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Applications</h2>
        
        {applications && applications.length > 0 ? (
          <div className="space-y-8">
            {/* Pending Applications */}
            {pendingApplications.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Pending Review ({pendingApplications.length})
                </h3>
                <div className="space-y-4">
                  {pendingApplications.map((application) => (
                    <ApplicationCard 
                      key={application.id} 
                      application={application} 
                      listingId={listing.id}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Accepted Applications */}
            {acceptedApplications.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Accepted ({acceptedApplications.length})
                </h3>
                <div className="space-y-4 opacity-75">
                  {acceptedApplications.map((application) => (
                    <ApplicationCard 
                      key={application.id} 
                      application={application} 
                      listingId={listing.id}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Rejected Applications */}
            {rejectedApplications.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Rejected ({rejectedApplications.length})
                </h3>
                <div className="space-y-4 opacity-50">
                  {rejectedApplications.map((application) => (
                    <ApplicationCard 
                      key={application.id} 
                      application={application} 
                      listingId={listing.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No applications yet"
            description="Share this listing to start receiving applications from verified coaches"
          />
        )}
      </div>
    </div>
  )
}

function ApplicationCard({ application, listingId }: { application: any, listingId: string }) {
  const coach = application.coach
  const profile = coach?.coach_profiles
  
  const badges = [
    {
      label: "WWCC",
      status: profile?.wwcc_number ? "verified" : "not-provided"
    },
    {
      label: "Insurance",
      status: profile?.insurance_url ? "verified" : "not-provided"
    },
    {
      label: "First Aid",
      status: profile?.first_aid_url ? "verified" : "not-provided"
    },
  ] as const
  
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-lg">{coach?.name || "Basketball Coach"}</h4>
              <p className="text-sm text-muted-foreground">{coach?.email}</p>
              {profile?.rating_avg && profile.rating_count > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-medium">{profile.rating_avg.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({profile.rating_count} reviews)</span>
                </div>
              )}
            </div>
            {application.proposed_rate && (
              <Badge variant="secondary" className="ml-4">
                ${application.proposed_rate}/hr
              </Badge>
            )}
          </div>
          
          {application.message && (
            <p className="text-muted-foreground mb-3">
              "{application.message}"
            </p>
          )}
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
            {profile?.suburbs && profile.suburbs.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.suburbs.slice(0, 2).join(", ")}
                {profile.suburbs.length > 2 && ` +${profile.suburbs.length - 2}`}
              </span>
            )}
            {profile?.travel_km && (
              <span>Travels up to {profile.travel_km}km</span>
            )}
          </div>
          
          <BadgeRow badges={badges} className="mb-4" />
          
          {application.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm">
                Accept & Book
              </Button>
              <Button size="sm" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive">
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
