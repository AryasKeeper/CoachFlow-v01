import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Users,
  Trophy,
  Target,
  Calendar,
  ArrowLeft,
  Clock,
  DollarSign,
  ChevronRight
} from "lucide-react"

export default async function PublicOrgProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const { id } = await params

  // Get organization's profile
  const { data: org, error: orgError } = await supabase
    .from('org_profiles')
    .select('*')
    .eq('user_id', id)
    .single()

  if (orgError || !org) {
    notFound()
  }

  // Get active listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('org_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6) // Show max 6 listings on profile

  const activeListings = listings?.length || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/coach/listings"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to listings
      </Link>

      {/* Header */}
      <GlassCard className="mb-6">
        <div className="flex items-start gap-4">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.org_name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {org.org_name || "Organization"}
            </h1>
            {org.org_type && (
              <Badge variant="secondary" className="mb-3 capitalize">
                {org.org_type.replace('_', ' ')}
              </Badge>
            )}
            {activeListings !== null && activeListings > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{activeListings} active {activeListings === 1 ? 'listing' : 'listings'}</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* About Organization */}
      {org.about_organization && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">About Us</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{org.about_organization}</p>
        </GlassCard>
      )}

      {/* Contact Information - Only show what org has chosen to provide */}
      {(org.contact_email || org.contact_phone || org.website_url) && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {org.contact_person_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{org.contact_person_name}</span>
                  {org.contact_person_title && (
                    <Badge variant="secondary" className="text-xs">
                      {org.contact_person_title}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {org.contact_email && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${org.contact_email}`} className="text-primary hover:underline">
                    {org.contact_email}
                  </a>
                </div>
              </div>
            )}
            {org.contact_phone && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${org.contact_phone}`} className="text-primary hover:underline">
                    {org.contact_phone}
                  </a>
                </div>
              </div>
            )}
            {org.website_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Website</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={org.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {org.website_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Location */}
      {(org.address || org.city) && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location
          </h2>
          <div className="space-y-2 text-muted-foreground">
            {org.address && <p>{org.address}</p>}
            {(org.city || org.state || org.zip_code) && (
              <p>
                {[org.city, org.state, org.zip_code].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </GlassCard>
      )}

      {/* Culture & Programs */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {org.team_culture && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Team Culture
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {org.team_culture}
            </p>
          </GlassCard>
        )}

        {org.program_details && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Our Programs
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {org.program_details}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Facility Features */}
      {org.facility_features && org.facility_features.length > 0 && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Our Facilities</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {org.facility_features.map((feature: string) => (
              <div key={feature} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Organization Stats */}
      {org.coaching_staff_size && org.coaching_staff_size > 0 && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Organization Details</h2>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Coaching Staff</span>
            <Badge variant="secondary">
              {org.coaching_staff_size} {org.coaching_staff_size === 1 ? 'coach' : 'coaches'}
            </Badge>
          </div>
        </GlassCard>
      )}

      {/* Active Listings */}
      {listings && listings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Current Opportunities</h2>
          <div className="grid gap-4">
            {listings.map((listing) => (
              <Link href={`/coach/listings/${listing.id}`} key={listing.id}>
                <GlassCard className="hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        {listing.urgency === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${listing.pay_min}-${listing.pay_max}/hr</span>
                        </div>
                        {listing.dates && listing.dates.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{listing.dates.length} {listing.dates.length === 1 ? 'date' : 'dates'}</span>
                          </div>
                        )}
                      </div>

                      {/* Required Badges */}
                      {listing.required_badges && listing.required_badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {listing.required_badges.map((badge: string) => (
                            <Badge key={badge} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-4" />
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>

          {/* View All Button if there are more listings */}
          <div className="mt-6">
            <Button className="w-full" variant="outline" asChild>
              <Link href={`/coach/listings?org=${id}`}>
                View All Opportunities from {org.org_name}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}