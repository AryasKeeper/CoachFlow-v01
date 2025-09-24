import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  User,
  MapPin,
  Phone,
  Mail,
  Award,
  Briefcase,
  Calendar,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Star,
  Clock,
  Shield,
  Target,
  Users,
  Trophy
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
    .select('email, name')
    .eq('id', id)
    .single()

  // Get completed bookings count (as a reputation indicator)
  const { count: completedJobs } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', id)
    .eq('status', 'completed')

  // Get applications count to show activity
  const { count: totalApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/org/applications"
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

            {/* Experience Level */}
            {coach.experience_level && (
              <Badge variant="default" className="mb-3">
                {coach.experience_level.charAt(0).toUpperCase() + coach.experience_level.slice(1)} Coach
              </Badge>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {coach.years_experience && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{coach.years_experience} years experience</span>
                </div>
              )}
              {completedJobs !== null && completedJobs > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{completedJobs} completed sessions</span>
                </div>
              )}
              {totalApplications !== null && totalApplications > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{totalApplications} applications sent</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Bio */}
      {coach.bio && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            About Me
          </h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{coach.bio}</p>
        </GlassCard>
      )}

      {/* Coaching Philosophy */}
      {coach.coaching_philosophy && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Coaching Philosophy
          </h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{coach.coaching_philosophy}</p>
        </GlassCard>
      )}

      {/* Certifications & Expertise */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Certifications */}
        {coach.certifications && coach.certifications.length > 0 && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Certifications
            </h3>
            <div className="space-y-2">
              {coach.certifications.map((cert: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{cert}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Areas of Expertise */}
        {coach.specializations && coach.specializations.length > 0 && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Areas of Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {coach.specializations.map((spec: string) => (
                <Badge key={spec} variant="secondary">
                  {spec}
                </Badge>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Experience Details */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Past Experience */}
        {coach.past_experience && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Past Experience
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {coach.past_experience}
            </p>
          </GlassCard>
        )}

        {/* Notable Achievements */}
        {coach.achievements && (
          <GlassCard>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Notable Achievements
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {coach.achievements}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Availability & Preferences */}
      <GlassCard className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Availability & Preferences</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3 text-sm text-muted-foreground">Work Preferences</h3>
            <div className="space-y-2">
              {coach.preferred_age_groups && coach.preferred_age_groups.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Preferred Age Groups</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {coach.preferred_age_groups.map((age: string) => (
                        <Badge key={age} variant="outline" className="text-xs">
                          {age}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {coach.desired_pay_min && coach.desired_pay_max && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Preferred Rate</p>
                    <p className="text-sm text-muted-foreground">
                      ${coach.desired_pay_min} - ${coach.desired_pay_max} per hour
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 text-sm text-muted-foreground">Availability</h3>
            <div className="space-y-2">
              {coach.availability && coach.availability.length > 0 && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Available Days</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {coach.availability.map((day: string) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {coach.available_from && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Available From</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(coach.available_from).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Location */}
      {(coach.city || coach.state) && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Location
          </h2>
          <p className="text-muted-foreground">
            {[coach.city, coach.state].filter(Boolean).join(', ')}
          </p>
          {coach.preferred_suburbs && coach.preferred_suburbs.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Preferred Areas</p>
              <div className="flex flex-wrap gap-2">
                {coach.preferred_suburbs.map((suburb: string) => (
                  <Badge key={suburb} variant="secondary" className="text-xs">
                    {suburb}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Contact Information - Limited for privacy */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
        <p className="text-muted-foreground mb-4">
          Interested in working with {user?.name || 'this coach'}? Contact them through the application process.
        </p>
        {coach.phone && (
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