import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ClipboardList,
  Calendar,
  DollarSign,
  MapPin,
  Star,
  Clock
} from "lucide-react"
// Date manipulation using native Date methods to replace date-fns

// Helper functions to replace date-fns
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

export default async function AdminAnalyticsPage() {
  const user = await requireRole('admin')
  const supabase = await createServerSupabaseClient()
  
  const now = new Date()
  const thisMonth = startOfMonth(now)
  const lastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1))
  const thisWeek = startOfWeek(now)
  const lastWeek = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
  
  // Get current period stats
  const [
    { count: usersThisMonth },
    { count: listingsThisMonth },
    { count: applicationsThisMonth },
    { count: bookingsThisMonth }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString()),
    supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString()),
    supabase.from('applications').select('*', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString()),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString())
  ])
  
  // Get previous period stats for comparison
  const [
    { count: usersLastMonth },
    { count: listingsLastMonth },
    { count: applicationsLastMonth },
    { count: bookingsLastMonth }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', thisMonth.toISOString()),
    supabase.from('listings').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', thisMonth.toISOString()),
    supabase.from('applications').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', thisMonth.toISOString()),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', thisMonth.toISOString())
  ])
  
  // Calculate growth rates
  const userGrowth = (usersLastMonth || 0) > 0 ? (((usersThisMonth || 0) - (usersLastMonth || 0)) / (usersLastMonth || 0) * 100) : 0
  const listingGrowth = (listingsLastMonth || 0) > 0 ? (((listingsThisMonth || 0) - (listingsLastMonth || 0)) / (listingsLastMonth || 0) * 100) : 0
  const applicationGrowth = (applicationsLastMonth || 0) > 0 ? (((applicationsThisMonth || 0) - (applicationsLastMonth || 0)) / (applicationsLastMonth || 0) * 100) : 0
  const bookingGrowth = (bookingsLastMonth || 0) > 0 ? (((bookingsThisMonth || 0) - (bookingsLastMonth || 0)) / (bookingsLastMonth || 0) * 100) : 0
  
  // Get top performing coaches
  const { data: topCoaches } = await supabase
    .from('coach_profiles')
    .select(`
      rating_avg,
      rating_count,
      user:users!coach_profiles_user_id_fkey(
        name,
        email
      )
    `)
    .not('rating_avg', 'is', null)
    .order('rating_avg', { ascending: false })
    .limit(5)
  
  // Get most active suburbs
  const { data: coachSuburbs } = await supabase
    .from('coach_profiles')
    .select('suburbs')
    .not('suburbs', 'is', null)
  
  // Flatten and count suburbs
  const suburbCounts: { [key: string]: number } = {}
  coachSuburbs?.forEach(coach => {
    if (coach.suburbs && Array.isArray(coach.suburbs)) {
      coach.suburbs.forEach((suburb: string) => {
        suburbCounts[suburb] = (suburbCounts[suburb] || 0) + 1
      })
    }
  })
  
  const topSuburbs = Object.entries(suburbCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
  
  const monthlyStats = [
    {
      label: "New Users",
      value: usersThisMonth || 0,
      previousValue: usersLastMonth || 0,
      growth: userGrowth,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "New Listings",
      value: listingsThisMonth || 0,
      previousValue: listingsLastMonth || 0,
      growth: listingGrowth,
      icon: ClipboardList,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Applications",
      value: applicationsThisMonth || 0,
      previousValue: applicationsLastMonth || 0,
      growth: applicationGrowth,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-600/10"
    },
    {
      label: "Bookings",
      value: bookingsThisMonth || 0,
      previousValue: bookingsLastMonth || 0,
      growth: bookingGrowth,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    }
  ]
  
  function formatGrowth(growth: number) {
    if (growth === 0) return "0%"
    const sign = growth > 0 ? "+" : ""
    return `${sign}${growth.toFixed(1)}%`
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Platform insights and performance metrics
        </p>
      </div>
      
      {/* Monthly Performance */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Monthly Performance</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {monthlyStats.map((stat) => (
            <GlassCard key={stat.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  stat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.growth >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {formatGrowth(stat.growth)}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.label} this month
                </p>
                <p className="text-xs text-muted-foreground">
                  vs {stat.previousValue} last month
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Performing Coaches */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Top Rated Coaches</h2>
          <GlassCard>
            <div className="space-y-4">
              {topCoaches && topCoaches.length > 0 ? (
                topCoaches.map((coach, index) => (
                  <div key={coach.user.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{coach.user.name || coach.user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {coach.rating_count} reviews
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-bold">{(coach.rating_avg || 0).toFixed(1)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No rated coaches yet
                </p>
              )}
            </div>
          </GlassCard>
        </div>
        
        {/* Popular Suburbs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Popular Service Areas</h2>
          <GlassCard>
            <div className="space-y-4">
              {topSuburbs.length > 0 ? (
                topSuburbs.map(([suburb, count], index) => (
                  <div key={suburb} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{suburb}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {count} coaches
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No location data yet
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
      
      {/* Platform Health Indicators */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Platform Health</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Growth Rate</p>
                <p className="text-sm text-muted-foreground">Monthly user growth</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatGrowth(userGrowth)}
            </p>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Conversion Rate</p>
                <p className="text-sm text-muted-foreground">Application to booking</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {(bookingsThisMonth || 0) > 0 && (applicationsThisMonth || 0) > 0 
                ? `${(((bookingsThisMonth || 0) / (applicationsThisMonth || 0)) * 100).toFixed(1)}%`
                : "0%"
              }
            </p>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Revenue Growth</p>
                <p className="text-sm text-muted-foreground">Monthly booking growth</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatGrowth(bookingGrowth)}
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
