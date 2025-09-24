'use client'

import { useEffect, useState } from 'react'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Show skeleton during hydration to prevent flash
  if (!mounted) {
    return <DashboardSkeleton />
  }
  
  return <>{children}</>
}
