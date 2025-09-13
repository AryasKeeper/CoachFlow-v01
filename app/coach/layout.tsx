import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  User,
  Shield,
  Calendar,
  ClipboardList,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  AlertCircle,
  Briefcase
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/user-dropdown"

const navItems = [
  {
    label: "Find Work",
    href: "/coach/listings",
    icon: Briefcase
  },
  {
    label: "My Applications",
    href: "/coach/applications",
    icon: FileText
  },
  {
    label: "Verification",
    href: "/coach/verify",
    icon: Shield
  },
  {
    label: "Availability",
    href: "/coach/availability",
    icon: Calendar
  }
]

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('coach')
  const supabase = await createServerSupabaseClient()
  
  // Get coach profile and user details to check verification status
  const { data: profile } = await supabase
    .from('coach_profiles')
    .select('*, user:users!coach_profiles_user_id_fkey(first_name, last_name)')
    .eq('user_id', user.id)
    .single()
  
  const isVerified = profile?.wwcc_number && profile?.insurance_url && profile?.first_aid_url
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Coach Portal</h2>
          <div className="mt-3">
            {isVerified ? (
              <Badge className="bg-green-500/10 text-green-700 border-green-200">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unverified
              </Badge>
            )}
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{item.label}</span>
              {item.label === "Verification" && !isVerified && (
                <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header with User Dropdown */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-end px-6">
            <UserDropdown
              email={user.email}
              role="coach"
              name={`${profile?.user?.first_name || ''} ${profile?.user?.last_name || ''}`.trim() || undefined}
            />
          </div>
        </div>

        {!isVerified && (
          <div className="bg-orange-500/10 border-b border-orange-200 px-4 py-3">
            <div className="container mx-auto flex items-center justify-between">
              <p className="text-sm text-orange-800">
                Complete your verification to start applying for coaching opportunities
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/coach/verify">
                  Complete Verification
                </Link>
              </Button>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
