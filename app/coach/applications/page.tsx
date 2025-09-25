import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import { ApplicationCard } from "./application-card"

export default async function CoachApplicationsPage() {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()

  // Get all applications with listing details
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      listing:listings(
        id,
        title,
        location,
        dates,
        time_intervals,
        status,
        pay_min,
        pay_max,
        urgency,
        gender_preference,
        org:users!listings_org_id_fkey(
          email,
          org_profiles!inner(
            org_name
          )
        )
      )
    `)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  const pendingApplications = applications?.filter(a => a.status === 'pending') || []
  const acceptedApplications = applications?.filter(a => a.status === 'accepted') || []
  const rejectedApplications = applications?.filter(a => a.status === 'rejected') || []

  const stats = [
    {
      label: "Total Applications",
      value: applications?.length || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10"
    },
    {
      label: "Pending Review",
      value: pendingApplications.length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-600/10"
    },
    {
      label: "Accepted",
      value: acceptedApplications.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-600/10"
    },
    {
      label: "Rejected",
      value: rejectedApplications.length,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-600/10"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
        <p className="text-muted-foreground">
          Track your coaching job applications
        </p>
      </div>

      {/* Stats Grid */}
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

      {applications && applications.length > 0 ? (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedApplications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length > 0 ? (
              pendingApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            ) : (
              <EmptyState
                icon={Clock}
                title="No pending applications"
                description="Applications awaiting review will appear here"
              />
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedApplications.length > 0 ? (
              acceptedApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            ) : (
              <EmptyState
                title="No accepted applications"
                description="Accepted applications will appear here"
              />
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedApplications.length > 0 ? (
              rejectedApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            ) : (
              <EmptyState
                title="No rejected applications"
                description="Rejected applications will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          title="No applications yet"
          description="Your job applications will appear here"
        />
      )}
    </div>
  )
}