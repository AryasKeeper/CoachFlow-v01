"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BadgeRow } from "@/components/ui/badge-row"
import {
  Edit,
  User,
  Mail,
  MapPin,
  DollarSign,
  Car,
  Star,
  Calendar,
  Award,
  Phone,
  Linkedin,
  CheckCircle,
  AlertCircle
} from "lucide-react"

export function CoachProfileClient({ initialData }: { initialData: any }) {
  const [coach, setCoach] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()


  // Refresh data when component mounts or when returning from edit
  useEffect(() => {
    const refreshProfile = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user data first - use maybeSingle to handle missing records
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()

      // Get profile data separately
      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Combine the data - always create a structure even if userData is null
      const freshData = {
        id: user.id,
        email: userData?.email || user.email || '',
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        coach_profiles: profileData || null
      }

      if (freshData) {
        setCoach(freshData)
      }
      setIsLoading(false)
    }

    // Refresh on focus to catch updates from edit page
    const handleFocus = () => {
      refreshProfile()
    }

    window.addEventListener('focus', handleFocus)
    refreshProfile() // Initial refresh

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [supabase])

  // Handle both array and object structure from Supabase
  const profile = Array.isArray(coach?.coach_profiles) ? coach?.coach_profiles[0] : coach?.coach_profiles


  const verificationBadges = [
    {
      label: "WWCC",
      status: profile?.wwcc_number ? "verified" as const : "not-provided" as const
    },
    {
      label: "Insurance",
      status: profile?.insurance_url ? "verified" as const : "not-provided" as const
    },
    {
      label: "First Aid",
      status: profile?.first_aid_url ? "verified" as const : "not-provided" as const
    },
  ]

  const isVerified = Boolean(
    profile?.wwcc_number &&
    profile?.wwcc_number.trim().length > 0 &&
    profile?.insurance_url &&
    profile?.insurance_url.trim().length > 0 &&
    profile?.first_aid_url &&
    profile?.first_aid_url.trim().length > 0
  )

  const completenessItems = [
    {
      label: "Bio & Philosophy",
      completed: Boolean(
        profile?.bio &&
        profile?.bio.trim().length > 0 &&
        profile?.coaching_philosophy &&
        profile?.coaching_philosophy.trim().length > 0
      )
    },
    {
      label: "Specializations",
      completed: Boolean(
        profile?.specialties &&
        Array.isArray(profile?.specialties) &&
        profile?.specialties.length > 0
      )
    },
    {
      label: "Service Areas",
      completed: Boolean(
        profile?.suburbs &&
        Array.isArray(profile?.suburbs) &&
        profile?.suburbs.length > 0
      )
    },
    {
      label: "Contact Information",
      completed: Boolean(
        (profile?.phone_number && profile?.phone_number.trim().length > 0) ||
        (profile?.linkedin_url && profile?.linkedin_url.trim().length > 0)
      )
    },
    {
      label: "Verification Documents",
      completed: isVerified
    }
  ]

  const completedCount = completenessItems.filter(item => item.completed).length
  const completionPercentage = Math.round((completedCount / completenessItems.length) * 100)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Edit Button */}
      <div className="flex justify-end mb-4">
        <Link href="/coach/profile/edit">
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Verification Alert */}
      {!isVerified && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Complete Your Verification</h3>
              <p className="text-sm text-red-700 mt-1">
                You need to complete your verification to start applying for coaching opportunities.
              </p>
              <Link href="/coach/verify">
                <Button variant="destructive" size="sm" className="mt-3">
                  Complete Verification →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert for Verified Coaches */}
      {isVerified && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Profile Verified</h3>
              <p className="text-sm text-green-700">
                You can now apply for coaching opportunities!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <GlassCard className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${coach?.first_name} ${coach?.last_name}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold">
                {coach?.first_name?.[0]}{coach?.last_name?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {coach?.first_name} {coach?.last_name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="w-4 h-4" />
                {coach?.email}
              </div>
              {profile?.phone_number && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Phone className="w-4 h-4" />
                  {profile.phone_number}
                </div>
              )}
              {profile?.linkedin_url && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Linkedin className="w-4 h-4" />
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>
          {profile?.rating_avg > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              <span className="font-semibold">{profile.rating_avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({profile.rating_count})</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Bio & Philosophy */}
      {(profile?.bio || profile?.coaching_philosophy) && (
        <GlassCard className="mb-6">
          {profile?.bio && (
            <>
              <h2 className="text-xl font-semibold mb-4">About Me</h2>
              <p className="text-muted-foreground mb-6">{profile.bio}</p>
            </>
          )}
          {profile?.coaching_philosophy && (
            <>
              <h2 className="text-xl font-semibold mb-4">Coaching Philosophy</h2>
              <p className="text-muted-foreground">{profile.coaching_philosophy}</p>
            </>
          )}
        </GlassCard>
      )}

      {/* Professional Details */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Experience & Rates */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Professional Details</h2>
          <div className="space-y-3">
            {profile?.years_experience > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium">{profile.years_experience} years</span>
              </div>
            )}
            {profile?.rate_hourly && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">${profile.rate_hourly}/hr</span>
              </div>
            )}
            {profile?.rate_flat && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Session Rate</span>
                <span className="font-medium">${profile.rate_flat}</span>
              </div>
            )}
            {profile?.travel_km && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Travel Radius</span>
                <span className="font-medium">{profile.travel_km} km</span>
              </div>
            )}
            {profile?.abn && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ABN</span>
                <span className="font-medium">{profile.abn}</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Service Areas & Specialties */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          {profile?.specialties?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {profile?.suburbs?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Service Areas</p>
              <div className="flex flex-wrap gap-2">
                {profile.suburbs.map((suburb: string, index: number) => (
                  <Badge key={index} variant="outline">
                    <MapPin className="w-3 h-3 mr-1" />
                    {suburb}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Achievements */}
      {profile?.achievements && (
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Achievements
          </h2>
          <p className="text-muted-foreground">{profile.achievements}</p>
        </GlassCard>
      )}

      {/* Verifications */}
      <GlassCard className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Verifications</h2>
        <BadgeRow badges={verificationBadges} />
        {!isVerified && (
          <div className="mt-4 p-3 bg-orange-500/10 rounded-lg">
            <p className="text-sm text-orange-700">
              Complete your verification to start applying for opportunities.
              <Link href="/coach/verify" className="ml-2 underline">
                Complete Verification →
              </Link>
            </p>
          </div>
        )}
      </GlassCard>

      {/* Profile Completeness */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Profile Completeness</h3>
          <span className="text-sm font-semibold">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="space-y-2 text-sm">
          {completenessItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.completed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={item.completed ? 'text-green-700' : 'text-muted-foreground'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}