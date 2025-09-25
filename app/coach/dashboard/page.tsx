import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BadgeRow } from "@/components/ui/badge-row"
import { LazyMiniProgressRing } from "@/components/lazy"
import Link from "next/link"
import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"
import { 
  ClipboardList, 
  FileText, 
  Calendar,
  DollarSign,
  Shield,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin
} from "lucide-react"

export default async function CoachDashboardPage() {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()
  
  // Get coach profile with error handling
  const { data: profile, error: profileError } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (profileError) {
    console.error('Error fetching coach profile:', profileError)
  }
  
  // Get stats with error handling
  const [
    applicationsResult,
    bookingsResult,
    listingsResult
  ] = await Promise.allSettled([
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id),
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
  ])
  
  const applicationsCount = applicationsResult.status === 'fulfilled' ? applicationsResult.value.count : 0
  const bookingsCount = bookingsResult.status === 'fulfilled' ? bookingsResult.value.count : 0
  const availableListings = listingsResult.status === 'fulfilled' ? listingsResult.value.count : 0
  
  // Get recent applications with error handling
  const { data: recentApplications, error: applicationsError } = await supabase
    .from('applications')
    .select(`
      *,
      listing:listings(
        title,
        location,
        org:users!listings_org_id_fkey(
          org_profiles!inner(
            org_name
          )
        )
      )
    `)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)
  
  if (applicationsError) {
    console.error('Error fetching recent applications:', applicationsError)
  }
  
  const isProfileComplete = profile &&
    profile.bio &&
    profile.specialties?.length > 0 &&
    profile.suburbs?.length > 0 &&
    (profile.rate_hourly || profile.rate_flat)

  // Only WWCC is required for verified status - First Aid and Insurance are optional enhancements
  const isVerified = !!(profile?.wwcc_number)

  // Calculate profile completion percentage
  const profileCompletion = (() => {
    if (!profile) return 0
    let completed = 0
    const total = 8

    if (profile.bio) completed++
    if (profile.specialties?.length > 0) completed++
    if (profile.suburbs?.length > 0) completed++
    if (profile.rate_hourly || profile.rate_flat) completed++
    if (profile.wwcc_number) completed++
    if (profile.insurance_url) completed++
    if (profile.first_aid_url) completed++
    if (profile.travel_km) completed++

    return Math.round((completed / total) * 100)
  })()
  
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
  
  const stats = [
    {
      label: "Total Applications",
      value: applicationsCount || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "Active Bookings",
      value: bookingsCount || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Available Jobs",
      value: availableListings || 0,
      icon: ClipboardList,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    }
  ]
  
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name || 'Coach'}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s your coaching dashboard
        </p>
      </div>
      
      {/* Profile Status Alert */}
      {(!isProfileComplete || !isVerified) && (
        <div className="mb-8 space-y-4">
          {!isProfileComplete && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Complete your profile</p>
                <p className="text-sm text-orange-700 mt-1">
                  Add your bio, specialties, suburbs, and rates to start receiving more opportunities
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/coach/profile">
                  Complete Profile
                </Link>
              </Button>
            </div>
          )}
          
          {!isVerified && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-200 flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Verification required</p>
                <p className="text-sm text-red-700 mt-1">
                  Upload your WWCC, insurance, and first aid documents to apply for jobs
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/coach/verify">
                  Get Verified
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button asChild disabled={!isVerified}>
          <Link href="/coach/listings">
            <ClipboardList className="w-4 h-4 mr-2" />
            Browse Jobs
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/coach/profile">
            Update Profile
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/coach/availability">
            Set Availability
          </Link>
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-6 hover:scale-[1.02] transition-transform cursor-default">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold animate-[scale-in_0.5s_ease-out]">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Profile Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{user.name || 'Basketball Coach'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LazyMiniProgressRing progress={profileCompletion} />
                {profile?.rating_avg && profile.rating_count > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">{profile.rating_avg.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{profile.rating_count} reviews</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              {profile?.rate_hourly && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">${profile.rate_hourly}/hr</span>
                </div>
              )}
              {profile?.suburbs && profile.suburbs.length > 0 && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-muted-foreground">Service Areas</span>
                  <span className="font-medium text-right">
                    {profile.suburbs.slice(0, 3).join(", ")}
                    {profile.suburbs.length > 3 && ` +${profile.suburbs.length - 3}`}
                  </span>
                </div>
              )}
              {profile?.travel_km && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Travel Distance</span>
                  <span className="font-medium">Up to {profile.travel_km}km</span>
                </div>
              )}
            </div>
            
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-3">Verification Status</p>
              <BadgeRow badges={verificationBadges} />
            </div>
            
            <Button className="w-full" variant="outline" asChild>
              <Link href="/coach/profile">
                Edit Profile
              </Link>
            </Button>
          </GlassCard>
        </div>
        
        {/* Recent Applications */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
          {recentApplications && recentApplications.length > 0 ? (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <GlassCard key={application.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{application.listing?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.listing?.org?.org_profiles?.org_name}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {application.listing?.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(application.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        application.status === 'accepted' ? 'default' :
                        application.status === 'pending' ? 'secondary' :
                        'outline'
                      }
                    >
                      {application.status}
                    </Badge>
                  </div>
                </GlassCard>
              ))}
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/coach/applications">
                  View All Applications
                </Link>
              </Button>
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {isVerified 
                  ? "You haven't applied to any jobs yet"
                  : "Complete verification to start applying"
                }
              </p>
              {isVerified && (
                <Button asChild>
                  <Link href="/coach/listings">
                    Browse Available Jobs
                  </Link>
                </Button>
              )}
            </GlassCard>
          )}
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Tips for Success</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <GlassCard className="p-4">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Complete Your Profile</h4>
                <p className="text-sm text-muted-foreground">
                  Coaches with complete profiles receive 3x more job offers
                </p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Respond Quickly</h4>
                <p className="text-sm text-muted-foreground">
                  Organizations appreciate prompt responses to messages
                </p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Build Your Reputation</h4>
                <p className="text-sm text-muted-foreground">
                  Great reviews lead to more opportunities
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
    </div>
  )
}
