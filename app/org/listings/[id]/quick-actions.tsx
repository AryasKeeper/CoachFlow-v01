'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import Link from 'next/link'
import {
  Edit,
  Pause,
  Play,
  Share2,
  Copy,
  Calendar,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Users
} from 'lucide-react'

interface QuickActionsProps {
  listingId: string
  listingTitle: string
  status: string
  applicationCount: number
}

export function QuickActions({
  listingId,
  listingTitle,
  status,
  applicationCount
}: QuickActionsProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)
  const [isReopening, setIsReopening] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleStatusChange = async (newStatus: 'closed' | 'active') => {
    const isClosingListing = newStatus === 'closed'

    if (isClosingListing) {
      if (!confirm(`Are you sure you want to close this listing? Coaches will no longer be able to apply.`)) {
        return
      }
      setIsClosing(true)
    } else {
      if (!confirm(`Are you sure you want to reopen this listing? Coaches will be able to apply again.`)) {
        return
      }
      setIsReopening(true)
    }

    try {
      const response = await fetch(`/api/org/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update listing status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating listing status:', error)
      alert('Failed to update listing status. Please try again.')
    } finally {
      setIsClosing(false)
      setIsReopening(false)
    }
  }

  const handleShare = () => {
    const listingUrl = `${window.location.origin}/coach/listings/${listingId}`
    navigator.clipboard.writeText(listingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDuplicate = async () => {
    if (!confirm('Create a duplicate of this listing? You can edit the details after duplication.')) {
      return
    }

    try {
      const response = await fetch(`/api/org/listings/${listingId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate listing')
      }

      const { data } = await response.json()
      router.push(`/org/listings/${data.id}/edit`)
    } catch (error) {
      console.error('Error duplicating listing:', error)
      alert('Failed to duplicate listing. Please try again.')
    }
  }

  const isClosed = status === 'closed'
  const isPaused = status === 'paused'
  const isActive = status === 'active'

  return (
    <GlassCard>
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-2">
        {/* Edit Listing - Always available */}
        <Link href={`/org/listings/${listingId}/edit`} className="w-full">
          <Button className="w-full justify-start" variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Listing
          </Button>
        </Link>

        {/* View Applications */}
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => {
            // Scroll to applications section
            document.getElementById('applications-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <Users className="w-4 h-4 mr-2" />
          View Applications ({applicationCount})
        </Button>

        {/* Close/Reopen Listing */}
        {isActive && (
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => handleStatusChange('closed')}
            disabled={isClosing}
          >
            <Pause className="w-4 h-4 mr-2" />
            {isClosing ? 'Closing...' : 'Close Listing'}
          </Button>
        )}

        {(isClosed || isPaused) && (
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => handleStatusChange('active')}
            disabled={isReopening}
          >
            <Play className="w-4 h-4 mr-2" />
            {isReopening ? 'Reopening...' : 'Reopen Listing'}
          </Button>
        )}

        {/* Share Listing */}
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={handleShare}
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              Share Listing
            </>
          )}
        </Button>

        {/* Duplicate Listing */}
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={handleDuplicate}
        >
          <Copy className="w-4 h-4 mr-2" />
          Duplicate Listing
        </Button>

        {/* View Public Page */}
        <Link href={`/coach/listings/${listingId}`} target="_blank" className="w-full">
          <Button className="w-full justify-start" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Public Page
          </Button>
        </Link>

        {/* Delete Listing - Destructive action at the bottom */}
        {isClosed && (
          <Link href={`/org/listings/${listingId}/edit`} className="w-full">
            <Button className="w-full justify-start" variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Listing
            </Button>
          </Link>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            {isActive && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600">Active</span>
              </>
            )}
            {isClosed && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-600">Closed</span>
              </>
            )}
            {isPaused && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-yellow-600">Paused</span>
              </>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}