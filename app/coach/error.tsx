'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Coach dashboard error:', error)
  }, [error])

  return (
    <div className="container mx-auto p-6">
      <GlassCard className="max-w-2xl mx-auto p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Something went wrong!</h2>
        <p className="text-muted-foreground mb-6">
          We encountered an error while loading your dashboard. This might be a temporary issue.
        </p>
        <div className="space-y-2">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <p className="text-sm text-muted-foreground">
            If the problem persists, please contact support.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
