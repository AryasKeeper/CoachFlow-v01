import { requireRole } from "@/lib/auth/utils"
import Link from "next/link"
import { redirect } from "next/navigation"
import { 
  LayoutDashboard, 
  Users,
  ClipboardList,
  Calendar,
  MessageSquare,
  BarChart3,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users
  },
  {
    label: "Listings",
    href: "/admin/listings",
    icon: ClipboardList
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: Calendar
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3
  }
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('admin')
  
  async function signOut() {
    'use server'
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
    redirect('/')
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Badge variant="secondary" className="mt-2">
            Administrator
          </Badge>
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
          <form action={signOut}>
            <Button 
              type="submit"
              variant="ghost" 
              className="w-full justify-start gap-3"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
