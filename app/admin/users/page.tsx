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
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  Building2
} from "lucide-react"
import { formatDate } from "@/lib/date-utils"

export default async function AdminUsersPage() {
  const user = await requireRole('admin')
  const supabase = await createServerSupabaseClient()
  
  // Get all users with their profiles
  const { data: users } = await supabase
    .from('users')
    .select(`
      *,
      coach_profiles(
        bio,
        specialties,
        wwcc_number,
        insurance_url,
        first_aid_url,
        rating_avg,
        rating_count
      ),
      org_profiles(
        org_name,
        org_type
      )
    `)
    .order('created_at', { ascending: false })
  
  // Get user statistics
  const stats = [
    {
      label: "Total Users",
      value: users?.length || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "Coaches",
      value: users?.filter(u => u.role === 'coach').length || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Organizations",
      value: users?.filter(u => u.role === 'org').length || 0,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10"
    },
    {
      label: "Verified Coaches",
      value: users?.filter(u => 
        u.role === 'coach' && 
        u.coach_profiles?.wwcc_number && 
        u.coach_profiles?.insurance_url && 
        u.coach_profiles?.first_aid_url
      ).length || 0,
      icon: UserCheck,
      color: "text-teal-600",
      bgColor: "bg-teal-600/10"
    }
  ]
  
  type UserWithProfile = {
    id: string
    email: string
    role: 'coach' | 'org' | 'admin'
    name: string | null
    phone: string | null
    created_at: string
    coach_profiles?: {
      wwcc_number: string | null
      insurance_url: string | null
      first_aid_url: string | null
    } | null
    org_profiles?: {
      org_name: string | null
      org_type: string | null
    } | null
  }

  function getUserStatusBadge(user: UserWithProfile) {
    if (user.role === 'coach') {
      const isVerified = user.coach_profiles?.wwcc_number && 
        user.coach_profiles?.insurance_url && 
        user.coach_profiles?.first_aid_url
      
      if (isVerified) {
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Verified</Badge>
      } else {
        return <Badge variant="secondary">Unverified</Badge>
      }
    } else if (user.role === 'org') {
      const hasProfile = user.org_profiles?.org_name
      return hasProfile ? 
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Active</Badge> : 
        <Badge variant="outline">Incomplete</Badge>
    }
    
    return <Badge>{user.role}</Badge>
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage all users on the platform
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
              placeholder="Search by name, email..."
              className="pl-10"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="coach">Coaches</SelectItem>
              <SelectItem value="org">Organizations</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>
      
      {/* Users Table */}
      <GlassCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Profile Info</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {getUserStatusBadge(user)}
                  </TableCell>
                  
                  <TableCell>
                    {user.role === 'coach' && user.coach_profiles ? (
                      <div className="text-sm">
                        {user.coach_profiles.specialties?.length > 0 && (
                          <p>{user.coach_profiles.specialties.slice(0, 2).join(', ')}</p>
                        )}
                        {user.coach_profiles.rating_avg && (
                          <p className="text-muted-foreground">
                            ⭐ {user.coach_profiles.rating_avg.toFixed(1)} ({user.coach_profiles.rating_count})
                          </p>
                        )}
                      </div>
                    ) : user.role === 'org' && user.org_profiles ? (
                      <div className="text-sm">
                        <p className="font-medium">{user.org_profiles.org_name}</p>
                        {user.org_profiles.org_type && (
                          <p className="text-muted-foreground">{user.org_profiles.org_type}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No profile</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(new Date(user.created_at), { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  )
}
