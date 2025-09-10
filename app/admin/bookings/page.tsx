import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Calendar,
  Search,
  DollarSign,
  MapPin,
  Clock,
  Building2,
  UserCheck,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import { format, parseISO, isFuture, isPast } from "date-fns"

export default async function AdminBookingsPage() {
  const user = await requireRole('admin')
  const supabase = await createServerSupabaseClient()
  
  // Get all bookings with related data
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings(
        title,
        location
      ),
      org:users!bookings_org_id_fkey(
        name,
        email,
        org_profiles!inner(
          org_name,
          org_type
        )
      ),
      coach:users!bookings_coach_id_fkey(
        name,
        email
      )
    `)
    .order('start_at', { ascending: false })
  
  // Calculate statistics
  const totalBookings = bookings?.length || 0
  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0
  
  const upcomingBookings = bookings?.filter(b => 
    b.status === 'confirmed' && isFuture(parseISO(b.start_at))
  ).length || 0
  
  const pastBookings = bookings?.filter(b => 
    isPast(parseISO(b.end_at))
  ).length || 0
  
  const totalRevenue = bookings?.reduce((acc, booking) => {
    if (booking.status === 'completed' || booking.status === 'confirmed') {
      const duration = (new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / (1000 * 60 * 60)
      return acc + (booking.rate * duration)
    }
    return acc
  }, 0) || 0
  
  const stats = [
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "Active Bookings",
      value: confirmedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Completed",
      value: completedBookings,
      icon: CheckCircle,
      color: "text-teal-600",
      bgColor: "bg-teal-600/10"
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    }
  ]
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">Cancelled</Badge>
      case 'rated':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">Rated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  function getBookingDuration(startAt: string, endAt: string) {
    const start = new Date(startAt)
    const end = new Date(endAt)
    const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return diffInHours
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
        <p className="text-muted-foreground">
          Monitor all coaching sessions and revenue
        </p>
      </div>
      
      {/* Stats */}
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
      
      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
              <p className="text-xl font-bold">{upcomingBookings}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Rate</p>
              <p className="text-xl font-bold">
                ${bookings?.length > 0 ? (bookings.reduce((acc, b) => acc + b.rate, 0) / bookings.length).toFixed(0) : 0}/hr
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-xl font-bold">
                {totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>
      </div>
      
      {/* Filters */}
      <GlassCard className="mb-6 p-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by organization, coach..."
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rated">Rated</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="this-week">This week</SelectItem>
              <SelectItem value="this-month">This month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>
      
      {/* Bookings Table */}
      <GlassCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings && bookings.length > 0 ? (
              bookings.map((booking) => {
                const duration = getBookingDuration(booking.start_at, booking.end_at)
                const totalCost = booking.rate * duration
                
                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.listing?.title}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{booking.listing?.location}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.org?.org_profiles?.org_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.org?.name}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.coach?.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.coach?.email}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {format(parseISO(booking.start_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(booking.start_at), 'h:mm a')} - {format(parseISO(booking.end_at), 'h:mm a')}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{duration}h</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">${booking.rate}/hr</p>
                        <p className="text-sm text-muted-foreground">
                          Total: ${totalCost.toFixed(2)}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  )
}
