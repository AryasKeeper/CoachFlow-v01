import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import {
  User,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle,
  Star,
  Clock,
  Shield,
  Target,
  Users,
  Trophy,
  DollarSign
} from "lucide-react"

export default async function PublicCoachProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const { id } = await params

  // Get coach's profile
  const { data: coach, error: coachError } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('user_id', id)
    .single()

  if (coachError || !coach) {
    notFound()
  }

  // Get coach's user info for basic details
  const { data: user } = await supabase
    .from('users')
    .select('email, name, phone')
    .eq('id', id)
    .single()

  // Get completed bookings count (as a reputation indicator)
  const { count: completedJobs } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', id)
    .eq('status', 'completed')

  // Only WWCC is required for verified status - First Aid and Insurance are optional enhancements
  const isVerified = !!(coach?.wwcc_number)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link
        href="/coach/applications"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to applications
      </Link>

      {/* Header */}
      <GlassCard className="mb-6">
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">
              {user?.name || 'Coach Profile'}
            </h1>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {completedJobs !== null && completedJobs > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{completedJobs} completed sessions</span>
                </div>
              )}
              
              {coach.rating_avg && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{coach.rating_avg.toFixed(1)} ({coach.rating_count} reviews)</span>
                </div>
              )}

              {isVerified && (
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Verified Coach</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Bio Section */}
      {coach.bio && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{coach.bio}</p>
        </GlassCard>
      )}

      {/* Specialties Section */}
      {coach.specialties && coach.specialties.length > 0 && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {coach.specialties.map((specialty: string, index: number) => (
              <Badge key={index} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Location & Availability */}
      <GlassCard className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Service Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Service Areas */}
          {coach.suburbs && coach.suburbs.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Service Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {coach.suburbs.map((suburb: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {suburb}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Rates */}
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Rates
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {coach.rate_hourly && (
                <p>Hourly: ${coach.rate_hourly}/hour</p>
              )}
              {coach.rate_flat && (
                <p>Session: ${coach.rate_flat}</p>
              )}
              {coach.travel_km && (
                <p>Will travel up to {coach.travel_km}km</p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Verification Status */}
      <GlassCard className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Verification Status</h2>
        <div className="space-y-3">
          
          {/* Working with Children Check */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${coach.wwcc_number ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Working with Children Check</p>
                <p className="text-sm text-muted-foreground">Required for coaching minors</p>
              </div>
            </div>
            {coach.wwcc_number ? (
              <Badge variant="default" className="bg-green-500">Verified</Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
          </div>

          {/* Professional Insurance */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${coach.insurance_url ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Professional Insurance</p>
                <p className="text-sm text-muted-foreground">Optional enhancement</p>
              </div>
            </div>
            {coach.insurance_url ? (
              <Badge variant="default" className="bg-green-500">Verified</Badge>
            ) : (
              <Badge variant="outline">Not provided</Badge>
            )}
          </div>

          {/* First Aid & CPR */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${coach.first_aid_url ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">First Aid & CPR</p>
                <p className="text-sm text-muted-foreground">Optional enhancement</p>
              </div>
            </div>
            {coach.first_aid_url ? (
              <Badge variant="default" className="bg-green-500">Verified</Badge>
            ) : (
              <Badge variant="outline">Not provided</Badge>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Contact Information - Limited for privacy */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
        <p className="text-muted-foreground mb-4">
          Interested in working with {user?.name || 'this coach'}? Contact them through the application process.
        </p>
        {user?.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Phone className="w-4 h-4" />
            <span>Phone number available after acceptance</span>
          </div>
        )}
        {user?.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>Email available after acceptance</span>
          </div>
        )}
      </GlassCard>
    </div>
  )
}