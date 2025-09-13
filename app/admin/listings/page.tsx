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
  ClipboardList,
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { formatDate } from "@/lib/date-utils"

export default async function AdminListingsPage() {
  const user = await requireRole('admin')
  const supabase = await createServerSupabaseClient()
  
  // Get all listings with organization info and application counts
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      org:users!listings_org_id_fkey(
        name,
        email,
        org_profiles!inner(
          org_name,
          org_type
        )
      ),
      applications(count)
    `)
    .order('created_at', { ascending: false })
  
  // Get listing statistics
  const totalListings = listings?.length || 0
  const activeListings = listings?.filter(l => l.status === 'active').length || 0
  const urgentListings = listings?.filter(l => l.urgency === 'urgent' && l.status === 'active').length || 0
  const totalApplications = listings?.reduce((acc, listing) => acc + (listing.applications?.[0]?.count || 0), 0) || 0
  
  const stats = [
    {
      label: "Total Listings",
      value: totalListings,
      icon: ClipboardList,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "Active Listings",
      value: activeListings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Urgent Needs",
      value: urgentListings,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-600/10"
    },
    {
      label: "Total Applications",
      value: totalApplications,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    }
  ]
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'closed':
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  function getUrgencyBadge(urgency: string | null) {
    if (!urgency) return null
    
    switch (urgency) {
      case 'urgent':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">Urgent</Badge>
      case 'soon':
        return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">Soon</Badge>
      case 'flexible':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Flexible</Badge>
      default:
        return <Badge variant="outline">{urgency}</Badge>
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Listings Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all coaching job listings
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
      
      {/* Filters */}
      <GlassCard className="mb-6 p-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, organization..."
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="soon">Soon</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>
      
      {/* Listings Table */}
      <GlassCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings && listings.length > 0 ? (
              listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{listing.title}</p>
                      <div className="flex items-center gap-2">
                        {getUrgencyBadge(listing.urgency)}
                        {listing.pay_min && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            ${listing.pay_min}-{listing.pay_max || '?'}/hr
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-medium">{listing.org?.org_profiles?.org_name}</p>
                      <p className="text-sm text-muted-foreground">{listing.org?.email}</p>
                      {listing.org?.org_profiles?.org_type && (
                        <p className="text-xs text-muted-foreground">{listing.org.org_profiles.org_type}</p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate max-w-[150px]">{listing.location}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(listing.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{listing.applications?.[0]?.count || 0}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(new Date(listing.created_at), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No listings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  )
}
