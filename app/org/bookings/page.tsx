import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default async function OrgBookingsPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()
  
  // Get all bookings for this organization
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings(
        title,
        location
      ),
      coach:users!bookings_coach_id_fkey(
        id,
        name,
        email,
        phone,
        coach_profiles!inner(
          bio,
          rate_hourly,
          rate_flat
        )
      )
    `)
    .eq('org_id', user.id)
    .order('start_at', { ascending: true })
  
  const now = new Date()
  const upcomingBookings = bookings?.filter(b => new Date(b.start_at) > now) || []
  const pastBookings = bookings?.filter(b => new Date(b.end_at) <= now) || []
  const activeBookings = bookings?.filter(b => 
    new Date(b.start_at) <= now && new Date(b.end_at) > now
  ) || []
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bookings</h1>
        <p className="text-muted-foreground">
          Manage your confirmed coaching sessions
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">{bookings?.length || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Now</p>
              <p className="text-2xl font-bold text-green-600">{activeBookings.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingBookings.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{pastBookings.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-gray-600" />
          </div>
        </GlassCard>
      </div>
      
      {bookings && bookings.length > 0 ? (
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} status="upcoming" />
              ))
            ) : (
              <EmptyState
                icon={Calendar}
                title="No upcoming bookings"
                description="Your upcoming coaching sessions will appear here"
              />
            )}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            {activeBookings.length > 0 ? (
              activeBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} status="active" />
              ))
            ) : (
              <EmptyState
                icon={Clock}
                title="No active sessions"
                description="Currently active coaching sessions will appear here"
              />
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {pastBookings.length > 0 ? (
              pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} status="past" />
              ))
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="No past bookings"
                description="Your completed coaching sessions will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          title="No bookings yet"
          description="Accept applications from coaches to create bookings"
        />
      )}
    </div>
  )
}

function BookingCard({ 
  booking, 
  status 
}: { 
  booking: any, 
  status: 'upcoming' | 'active' | 'past' 
}) {
  const coach = booking.coach
  const listing = booking.listing
  
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Active Now</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Upcoming</Badge>
      case 'past':
        return <Badge variant="secondary">Completed</Badge>
      default:
        return null
    }
  }
  
  return (
    <GlassCard>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{listing?.title}</h3>
              <p className="text-sm text-muted-foreground">
                Coach: {coach?.name || 'Basketball Coach'}
              </p>
            </div>
            {getStatusBadge()}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(new Date(booking.start_at), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(new Date(booking.start_at), "h:mm a")} - 
                  {format(new Date(booking.end_at), "h:mm a")}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{listing?.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{coach?.email}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rate:</span>
              <span className="font-medium">${booking.rate}/hr</span>
            </div>
            
            <div className="flex gap-2">
              {status !== 'past' && (
                <>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/messages/${booking.id}`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Link>
                  </Button>
                  {status === 'upcoming' && (
                    <Button size="sm" variant="ghost" className="text-destructive">
                      Cancel
                    </Button>
                  )}
                </>
              )}
              {status === 'past' && booking.status !== 'rated' && (
                <Button size="sm">
                  Rate Coach
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
