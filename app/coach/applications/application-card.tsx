"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { ContactDetailsCard } from "@/components/contact-details-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Clock,
  AlertTriangle
} from "lucide-react"
import { formatDate } from "@/lib/date-utils"

interface Application {
  id: string
  coach_id: string
  listing_id: string
  status: string
  created_at: string
  cover_letter?: string
  message?: string | null
  proposed_rate?: number | null
  contact_revealed?: boolean
  withdrawn_at?: string
  listing?: {
    id: string
    title: string
    location: string
    dates?: unknown
    time_intervals?: unknown
    pay_min?: number
    pay_max?: number
    urgency?: string
    gender_preference?: string
    status?: string
    org?: {
      email?: string
      org_profiles?: {
        org_name: string
        contact_person_name?: string
        contact_phone?: string
      }
    }
  }
}

export function ApplicationCard({ application }: { application: Application }) {
  const router = useRouter()
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const listing = application.listing
  const coerceToDate = (value: unknown): Date | null => {
    if (!value) return null
    if (Array.isArray(value)) {
      const arr = value as Array<string | number>
      if (arr.length === 0) return null
      const first = arr.sort()[0]
      return coerceToDate(first)
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    }
    return null
  }

  const nextDate = coerceToDate(listing?.dates)

  const getStatusBadge = () => {
    switch (application.status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Accepted</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{application.status}</Badge>
    }
  }

  const handleWithdrawApplication = async () => {
    setIsWithdrawing(true)
    const supabase = createClient()

    try {
      console.log('Attempting to withdraw application:', application.id)

      // Delete the application
      const { data, error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id)
        .select() // Return deleted rows to confirm deletion

      if (error) {
        console.error('Supabase error withdrawing application:', error)
        // More specific error messages
        if (error.code === 'PGRST116') {
          alert('Permission denied. The application deletion policy may not be active yet. Please contact support or try again later.')
        } else if (error.message?.includes('violates foreign key constraint')) {
          alert('Cannot withdraw application due to existing messages. Please contact support.')
        } else {
          alert(`Failed to withdraw application: ${error.message || 'Unknown error'}`)
        }
      } else {
        console.log('Application withdrawn successfully:', data)
        // Close dialog first
        setShowWithdrawDialog(false)
        // Then refresh the page to show updated list
        router.refresh()
      }
    } catch (error) {
      console.error('Unexpected error withdrawing application:', error)
      alert('An unexpected error occurred. Please check the console for details.')
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <>
      <GlassCard>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Link
                  href={`/coach/listings/${listing?.id}`}
                  className="text-lg font-semibold hover:text-primary transition-colors"
                >
                  {listing?.title || "Deleted Listing"}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {listing?.org?.org_profiles?.org_name || "Unknown Organization"}
                  </span>
                  {listing?.status !== 'active' && (
                    <Badge variant="outline" className="text-xs">
                      Listing {listing?.status}
                    </Badge>
                  )}
                </div>
              </div>
              {getStatusBadge()}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{listing?.location || "Location TBD"}</span>
                </div>
                {nextDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Starts {formatDate(nextDate, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {(listing?.pay_min || listing?.pay_max) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {listing.pay_min && listing.pay_max
                        ? `$${listing.pay_min} - $${listing.pay_max}/hr`
                        : listing.pay_min
                        ? `From $${listing.pay_min}/hr`
                        : `Up to $${listing.pay_max}/hr`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Applied {formatDate(application.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {application.message && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Your Application Message:</p>
                <p className="text-sm text-muted-foreground">{application.message}</p>
              </div>
            )}

            {application.proposed_rate && (
              <div className="mb-4">
                <Badge variant="outline">
                  Proposed Rate: ${application.proposed_rate}/hr
                </Badge>
              </div>
            )}

            {/* Show contact details for accepted applications */}
            {application.status === 'accepted' && (
              <div className="mt-4">
                <ContactDetailsCard
                  contactInfo={{
                    name: listing?.org?.org_profiles?.contact_person_name || listing?.org?.org_profiles?.org_name,
                    email: listing?.org?.email,
                    phone: listing?.org?.org_profiles?.contact_phone,
                    organization: listing?.org?.org_profiles?.org_name,
                    location: listing?.location
                  }}
                  type="org"
                  isRevealed={application.contact_revealed || false}
                />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {application.status === 'pending' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setShowWithdrawDialog(true)}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Withdraw Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw this application for &ldquo;{listing?.title}&rdquo;?
              This action cannot be undone. You can reapply to this listing later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
              disabled={isWithdrawing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawApplication}
              disabled={isWithdrawing}
              variant="destructive"
            >
              {isWithdrawing ? 'Withdrawing...' : 'Yes, Withdraw Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}