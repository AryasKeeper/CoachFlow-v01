import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  MessageSquare,
  Settings,
  Building2,
  Users
} from "lucide-react"
import { UserDropdown } from "@/components/user-dropdown"

const navItems = [
  {
    label: "My Listings",
    href: "/org/listings",
    icon: ClipboardList
  },
  {
    label: "Applications",
    href: "/org/applications",
    icon: Users
  },
  {
    label: "Bookings",
    href: "/org/bookings",
    icon: Calendar
  }
]

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()

  // Get org profile
  const { data: profile } = await supabase
    .from('org_profiles')
    .select('org_name')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Organization Portal</h2>
          <p className="text-sm text-muted-foreground">
            {profile?.org_name || 'Organization'}
          </p>
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
              role="org"
              name={profile?.org_name || undefined}
            />
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
