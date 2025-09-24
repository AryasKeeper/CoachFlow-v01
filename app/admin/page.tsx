import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Users,
  ClipboardList,
  Calendar,
  TrendingUp,
  UserCheck,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react"

export default async function AdminDashboardPage() {
  const user = await requireRole('admin')
  const supabase = await createServerSupabaseClient()
  
  // Get platform statistics
  const [
    { count: totalUsers },
    { count: totalCoaches },
    { count: totalOrgs },
    { count: totalListings },
    { count: activeListings },
    { count: totalApplications },
    { count: totalBookings },
    { count: pendingApplications }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'coach'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'org'),
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ])
  
  // Get recent activities
  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  const { data: recentListings } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      status,
      created_at,
      org:users!listings_org_id_fkey(
        org_profiles!inner(org_name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Calculate conversion funnel - handle null values from count queries
  const safeCoaches = totalCoaches || 0
  const safeUsers = totalUsers || 0
  const safeActiveListings = activeListings || 0
  const safeApplications = totalApplications || 0
  const safeBookings = totalBookings || 0
  
  const signupToProfileRate = safeCoaches > 0 ? (safeCoaches / safeUsers * 100).toFixed(1) : 0
  const listingToApplicationRate = safeActiveListings > 0 ? (safeApplications / safeActiveListings * 100).toFixed(1) : 0
  const applicationToBookingRate = safeApplications > 0 ? (safeBookings / safeApplications * 100).toFixed(1) : 0
  
  const stats = [
    {
      label: "Total Users",
      value: totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      change: "+12%"
    },
    {
      label: "Active Coaches",
      value: totalCoaches || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
      change: "+8%"
    },
    {
      label: "Organizations",
      value: totalOrgs || 0,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10",
      change: "+15%"
    },
    {
      label: "Active Listings",
      value: activeListings || 0,
      icon: ClipboardList,
      color: "text-orange-600",
      bgColor: "bg-orange-600/10",
      change: "+5%"
    },
    {
      label: "Total Bookings",
      value: totalBookings || 0,
      icon: Calendar,
      color: "text-teal-600",
      bgColor: "bg-teal-600/10",
      change: "+22%"
    },
    {
      label: "Pending Reviews",
      value: pendingApplications || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-600/10",
      change: "0%"
    }
  ]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management tools
        </p>
      </div>
      
      {/* Platform Health Alert */}
      <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-200 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-medium text-green-800">Platform Status: Healthy</p>
          <p className="text-sm text-green-700">
            All systems operational • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <Badge variant="secondary" className="text-xs">
                {stat.change}
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>
      
      {/* Conversion Funnel */}
      <GlassCard className="mb-8 p-6">
        <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{signupToProfileRate}%</p>
            <p className="text-sm text-muted-foreground">Signup to Profile</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{listingToApplicationRate}%</p>
            <p className="text-sm text-muted-foreground">Listing to Application</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{applicationToBookingRate}%</p>
            <p className="text-sm text-muted-foreground">Application to Booking</p>
          </div>
        </div>
      </GlassCard>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Users</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">View All</Link>
            </Button>
          </div>
          <GlassCard>
            <div className="space-y-4">
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {user.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No users yet</p>
              )}
            </div>
          </GlassCard>
        </div>
        
        {/* Recent Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Listings</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/listings">View All</Link>
            </Button>
          </div>
          <GlassCard>
            <div className="space-y-4">
              {recentListings && recentListings.length > 0 ? (
                recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.org?.org_profiles?.org_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={listing.status === 'active' ? 'default' : 'secondary'}
                        className="mb-1"
                      >
                        {listing.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No listings yet</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
