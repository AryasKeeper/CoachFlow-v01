import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ContactDetailsCard } from "@/components/contact-details-card"
import Link from "next/link"
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Building2
} from "lucide-react"
import { formatDate } from "@/lib/date-utils"

export default async function OrgApplicationsPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()

  // Get all applications to this org's listings
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      listing:listings!inner(
        id,
        title,
        location,
        dates,
        status
      ),
      coach:users!applications_coach_id_fkey(
        id,
        email,
        first_name,
        last_name,
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
          rating_count,
          phone_number,
          preferred_contact_method,
          linkedin_url,
          years_experience
        )
      )
    `)
    .eq('listing.org_id', user.id)
    .order('created_at', { ascending: false })

  const pendingApplications = applications?.filter(a => a.status === 'pending') || []
  const acceptedApplications = applications?.filter(a => a.status === 'accepted') || []
  const rejectedApplications = applications?.filter(a => a.status === 'rejected') || []

  const stats = [
    {
      label: "Total Applications",
      value: applications?.length || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "Pending Review",
      value: pendingApplications.length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-600/10"
    },
    {
      label: "Accepted",
      value: acceptedApplications.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Rejected",
      value: rejectedApplications.length,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-600/10"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Applications</h1>
        <p className="text-muted-foreground">
          Review and manage applications across all your listings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-8">
          {/* Pending Applications */}
          {pendingApplications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Pending Review ({pendingApplications.length})
              </h2>
              <div className="space-y-4">
                {pendingApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Accepted Applications */}
          {acceptedApplications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Accepted ({acceptedApplications.length})
              </h2>
              <div className="space-y-4">
                {acceptedApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Applications */}
          {rejectedApplications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Rejected ({rejectedApplications.length})
              </h2>
              <div className="space-y-4 opacity-50">
                {rejectedApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No applications yet"
          description="Applications will appear here when coaches apply to your listings"
        />
      )}
    </div>
  )
}

function ApplicationCard({ application }: { application: any }) {
  const coach = application.coach
  const profile = coach?.coach_profiles
  const listing = application.listing

  const getStatusBadge = () => {
    switch (application.status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{application.status}</Badge>
    }
  }

  return (
    <GlassCard>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">
              {coach?.first_name} {coach?.last_name}
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">{coach?.email}</p>
          <Link
            href={`/org/listings/${listing.id}`}
            className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1"
          >
            <Building2 className="w-3 h-3" />
            {listing.title}
          </Link>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Applied</p>
          <p className="text-sm font-medium">
            {formatDate(application.created_at, { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {application.message && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm">{application.message}</p>
        </div>
      )}

      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
        {profile?.years_experience > 0 && (
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {profile.years_experience} years exp
          </span>
        )}
        {profile?.suburbs && profile.suburbs.length > 0 && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {profile.suburbs.slice(0, 2).join(", ")}
            {profile.suburbs.length > 2 && ` +${profile.suburbs.length - 2}`}
          </span>
        )}
        {application.proposed_rate && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            ${application.proposed_rate}/hr
          </span>
        )}
      </div>

      {/* Show contact details for accepted applications */}
      {application.status === 'accepted' && (
        <ContactDetailsCard
          contactInfo={{
            name: `${coach?.first_name} ${coach?.last_name}`,
            email: coach?.email,
            phone: profile?.phone_number,
            preferredContact: profile?.preferred_contact_method,
            linkedin: profile?.linkedin_url
          }}
          type="coach"
          isRevealed={application.contact_revealed || false}
        />
      )}

      {/* Action buttons for pending applications */}
      {application.status === 'pending' && (
        <div className="flex gap-2">
          <Link href={`/coaches/${coach.id}`}>
            <Button size="sm" variant="outline">
              <User className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </Link>
          <Link href={`/org/listings/${listing.id}`}>
            <Button size="sm">
              Review Application
            </Button>
          </Link>
        </div>
      )}
    </GlassCard>
  )
}