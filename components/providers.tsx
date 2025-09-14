"use client"

import { AiHelpDrawer } from "@/components/ai-help-drawer"
import { ReactQueryProvider } from "@/lib/react-query"
import { ThemeProvider } from "@/lib/theme/theme-context"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

function ProvidersInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check authentication status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Show AI help drawer on authenticated pages (dashboards, etc)
  const showAiHelp = isAuthenticated && (
    pathname?.includes('/dashboard') ||
    pathname?.includes('/listings') ||
    pathname?.includes('/bookings') ||
    pathname?.includes('/applications') ||
    pathname?.includes('/profile') ||
    pathname?.includes('/post')
  )

  return (
    <ReactQueryProvider>
      <NotificationProvider>
        {children}
        {showAiHelp && <AiHelpDrawer />}
      </NotificationProvider>
    </ReactQueryProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProvidersInner>{children}</ProvidersInner>
    </ThemeProvider>
  )
}
