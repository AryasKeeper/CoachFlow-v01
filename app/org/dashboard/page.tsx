import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { queryOptimizer } from "@/lib/database"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  ClipboardList, 
  Users, 
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock
} from "lucide-react"

export default async function OrgDashboardPage() {
  const user = await requireRole('org')
  
  // Get organization stats using optimized dashboard function
  const { data: dashboardStats } = await queryOptimizer.getUserDashboardStats(user.id)
  
  // Get recent listings using optimized query
  const { data: recentListings } = await queryOptimizer.getActiveListings({
    limit: 3
  })
  
  // Extract stats with defaults
  const listingsCount = dashboardStats?.total_listings || 0
  const applicationsCount = dashboardStats?.total_applications || 0  
  const bookingsCount = dashboardStats?.total_bookings || 0
  
  const stats = [
    {
      label: "Active Listings",
      value: listingsCount || 0,
      icon: ClipboardList,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "Total Applicants",
      value: applicationsCount || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Active Bookings",
      value: bookingsCount || 0,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    }
  ]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name || 'there'}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your coaching needs and activities
        </p>
      </div>
      
      <Badge variant="secondary" className="mb-8">
        <span className="mr-2">🎉</span>
        Free during beta - Unlimited listings
      </Badge>
      
      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/org/post">
            <Plus className="w-4 h-4 mr-2" />
            Post New Need
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/org/listings">
            View All Listings
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/org/bookings">
            Manage Bookings
          </Link>
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      
      {/* Recent Listings */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Listings</h2>
          {recentListings && recentListings.length > 0 ? (
            <div className="space-y-4">
              {recentListings.map((listing) => (
                <GlassCard key={listing.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {listing.location}
                      </p>
                    </div>
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                      {listing.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        0 applicants
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/org/listings/${listing.id}`}>
                        View
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </GlassCard>
              ))}
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/org/listings">
                  View All Listings
                </Link>
              </Button>
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't posted any coaching needs yet
              </p>
              <Button asChild>
                <Link href="/org/post">
                  Post Your First Need
                </Link>
              </Button>
            </GlassCard>
          )}
        </div>
        
        {/* Tips Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tips for Success</h2>
          <div className="space-y-4">
            <GlassCard className="p-4">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Complete Your Profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Organizations with complete profiles receive 40% more applications
                  </p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Be Specific</h4>
                  <p className="text-sm text-muted-foreground">
                    Detailed listings with clear requirements attract better-matched coaches
                  </p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Respond Quickly</h4>
                  <p className="text-sm text-muted-foreground">
                    The best coaches get booked fast - review applications promptly
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
