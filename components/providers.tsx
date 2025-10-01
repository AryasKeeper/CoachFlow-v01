"use client"

import { Suspense } from "react"
import { AiHelpDrawer } from "@/components/ai-help-drawer"
import { ReactQueryProvider } from "@/lib/react-query"
import { ThemeProvider } from "@/lib/theme/theme-context"
import { NavigationLoadingProvider } from "@/components/navigation-loading-provider"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

function AiHelpWrapper() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Show AI help drawer on authenticated pages (dashboards, etc)
  const showAiHelp = !!user && (
    pathname?.includes('/dashboard') ||
    pathname?.includes('/listings') ||
    pathname?.includes('/bookings') ||
    pathname?.includes('/applications') ||
    pathname?.includes('/profile') ||
    pathname?.includes('/post')
  )

  return showAiHelp ? <AiHelpDrawer /> : null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactQueryProvider>
          <Suspense fallback={null}>
            <NavigationLoadingProvider>
              {children}
              <AiHelpWrapper />
            </NavigationLoadingProvider>
          </Suspense>
        </ReactQueryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
