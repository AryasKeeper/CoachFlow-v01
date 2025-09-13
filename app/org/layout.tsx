import { requireRole } from "@/lib/auth/utils"
import Link from "next/link"
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar,
  MessageSquare,
  Settings
} from "lucide-react"
import { SidebarSignOut } from "@/components/sidebar-signout"

const navItems = [
  {
    label: "Dashboard",
    href: "/org/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Listings",
    href: "/org/listings",
    icon: ClipboardList
  },
  {
    label: "Bookings",
    href: "/org/bookings",
    icon: Calendar
  },
  // Messages feature temporarily disabled - will be replaced with contact details
  // {
  //   label: "Messages",
  //   href: "/org/messages",
  //   icon: MessageSquare
  // },
  {
    label: "Settings",
    href: "/org/settings",
    icon: Settings
  }
]

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('org')
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Organization Portal</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
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
        
        <div className="p-4 mt-auto">
          <SidebarSignOut />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
