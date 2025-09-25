"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BadgeRow } from "@/components/ui/badge-row"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import Link from "next/link"
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign,
  Building2,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { formatDate } from "@/lib/date-utils"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function CoachListingDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [proposedRate, setProposedRate] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isFirstApplication, setIsFirstApplication] = useState(false)
  
  const supabase = createClient()
  
  useEffect(() => {
    loadListing()
  }, [resolvedParams.id])
  
  async function loadListing() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/sign-in')
        return
      }
      
      // Check if coach is verified - only WWCC is required
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('wwcc_number, insurance_url, first_aid_url')
        .eq('user_id', user.id)
        .single()
        
      setIsVerified(!!(profile?.wwcc_number))
      
      // Get listing details with organization profile
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select(`
          *,
          org_profiles!inner(
            org_id:user_id,
            org_name,
            org_type,
            bio,
            website,
            phone,
            address,
            logo_url
          )
        `)
        .eq('id', resolvedParams.id)
        .single()
        
      if (listingError) {
        setError('Listing not found')
        return
      }
      
      setListing(listingData)
      
      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('listing_id', resolvedParams.id)
        .eq('coach_id', user.id)
        .single()
        
      setHasApplied(!!existingApplication)
      
      // Check if this would be the coach's first application
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
      
      setIsFirstApplication(count === 0)
    } catch (err) {
      setError('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleApply() {
    if (!applicationMessage.trim()) {
      setError("Please include a message with your application")
      return
    }
    
    setApplying(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to apply')
        return
      }
      
      // Create the application
      const { data: application, error: applyError } = await supabase
        .from('applications')
        .insert({
          listing_id: resolvedParams.id,
          coach_id: user.id,
          message: applicationMessage,
          proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
          status: 'pending'
        })
        .select()
        .single()
        
      if (applyError) {
        setError(applyError.message)
        return
      }

      // Messaging feature removed - organizations use their own communication channels

      setSuccess(true)
      setHasApplied(true)
      setTimeout(() => {
        router.push('/coach/applications')
      }, 2000)
    } catch (err) {
      setError('Failed to submit application')
    } finally {
      setApplying(false)
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }
  
  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-semibold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This listing may have been removed or is no longer available
          </p>
          <Button asChild>
            <Link href="/coach/listings">
              Browse Other Opportunities
            </Link>
          </Button>
        </GlassCard>
      </div>
    )
  }
  
  const requiredBadgesList = listing.required_badges?.map((badge: string) => ({
    label: badge.toUpperCase().replace('-', ' '),
    status: 'verified' as const
  })) || []
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/coach/listings" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to listings
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{listing.org_profiles?.org_name || 'Organization'}</span>
              </div>
              {listing.urgency && (
                <Badge 
                  variant="outline"
                  className={
                    listing.urgency === 'urgent' 
                      ? 'border-red-200 text-red-700' 
                      : listing.urgency === 'soon'
                      ? 'border-orange-200 text-orange-700'
                      : ''
                  }
                >
                  {listing.urgency}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Already Applied Alert */}
      {hasApplied && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">You've already applied</p>
            <p className="text-sm text-green-700">
              View your application status in your{' '}
              <Link href="/coach/applications" className="underline">
                applications dashboard
              </Link>
            </p>
          </div>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {listing.description && (
            <GlassCard>
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </GlassCard>
          )}
          
          <GlassCard>
            <h2 className="text-lg font-semibold mb-3">Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span>{listing.location}</span>
              </div>
              
              {listing.pay_min || listing.pay_max ? (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {listing.pay_min && listing.pay_max
                      ? `$${listing.pay_min} - $${listing.pay_max}/hr`
                      : listing.pay_min
                      ? `From $${listing.pay_min}/hr`
                      : `Up to $${listing.pay_max}/hr`
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span>Rate negotiable</span>
                </div>
              )}
              
              {listing.dates && Array.isArray(listing.dates) && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Dates</p>
                    <div className="space-y-1">
                      {listing.dates.map((date: string, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {formatDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {listing.timeslots && Array.isArray(listing.timeslots) && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Time Slots</p>
                    <div className="flex flex-wrap gap-2">
                      {listing.timeslots.map((slot: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
          
          {requiredBadgesList.length > 0 && (
            <GlassCard>
              <h2 className="text-lg font-semibold mb-3">Required Certifications</h2>
              <BadgeRow badges={requiredBadgesList} />
            </GlassCard>
          )}
        </div>
        
        {/* Application Form */}
        <div>
          {!hasApplied && (
            <GlassCard className="sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Apply for this opportunity</h2>
              
              {isVerified ? (
                // Show full application form for verified coaches
                <>
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  
                  {success ? (
                    <div className="text-center py-8 relative">
                      {isFirstApplication ? (
                        <>
                          {/* Firework animation for first application */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="animate-ping absolute top-4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <div className="animate-ping absolute top-8 right-1/4 w-2 h-2 bg-blue-400 rounded-full animation-delay-200"></div>
                            <div className="animate-ping absolute top-12 left-1/3 w-2 h-2 bg-green-400 rounded-full animation-delay-400"></div>
                            <div className="animate-ping absolute top-6 right-1/3 w-2 h-2 bg-red-400 rounded-full animation-delay-600"></div>
                          </div>
                          <div className="text-6xl mb-4">🎉</div>
                          <p className="text-xl font-bold text-green-800 mb-2">
                            Congrats on your first application!
                          </p>
                          <p className="text-sm text-muted-foreground">
                            You're on your way to coaching greatness! Redirecting to your applications...
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                          <p className="text-lg font-semibold text-green-800 mb-2">
                            Nice! You successfully applied for this listing
                          </p>
                          <p className="text-sm text-muted-foreground">
                            We'll notify you when the organization responds. Redirecting...
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="message">Message to organization</Label>
                        <Textarea
                          id="message"
                          rows={4}
                          placeholder="Introduce yourself and explain why you're a great fit for this role..."
                          value={applicationMessage}
                          onChange={(e) => setApplicationMessage(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="rate">Proposed rate ($/hr)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="rate"
                            type="number"
                            min="0"
                            step="5"
                            placeholder={listing.pay_min ? listing.pay_min.toString() : "60"}
                            className="pl-10"
                            value={proposedRate}
                            onChange={(e) => setProposedRate(e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leave blank to discuss rate later
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={applying}
                      >
                        {applying ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Application
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </>
              ) : (
                // Show grayed-out button for unverified coaches
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-200 flex items-center gap-3 text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-700">
                      Complete verification to unlock application features
                    </span>
                  </div>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button 
                          className="w-full opacity-50 cursor-not-allowed" 
                          disabled
                          variant="secondary"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Apply Now
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Complete the verification process to apply today!
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="text-center">
                    <Button size="sm" asChild>
                      <Link href="/coach/verify">
                        Get Verified Now
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          )}
          
          {/* Organization Info */}
          <GlassCard className="mt-4">
            <h3 className="font-semibold mb-4">About the organization</h3>
            {listing.org_profiles ? (
              <div className="space-y-3">
                {/* Org Logo and Name */}
                <div className="flex items-start gap-3">
                  {listing.org_profiles.logo_url ? (
                    <img
                      src={listing.org_profiles.logo_url}
                      alt={listing.org_profiles.org_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{listing.org_profiles.org_name}</p>
                    {listing.org_profiles.org_type && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {listing.org_profiles.org_type.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {listing.org_profiles.bio && (
                  <p className="text-sm text-muted-foreground">
                    {listing.org_profiles.bio}
                  </p>
                )}

                {/* Contact Details */}
                <div className="space-y-2 text-sm">
                  {listing.org_profiles.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">🌐</span>
                      <a
                        href={listing.org_profiles.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {listing.org_profiles.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {listing.org_profiles.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">📞</span>
                      <span>{listing.org_profiles.phone}</span>
                    </div>
                  )}
                  {listing.org_profiles.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">📍</span>
                      <span>{listing.org_profiles.address}</span>
                    </div>
                  )}
                </div>

                {/* View Profile Button */}
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/org/${listing.org_id}`}>
                      View Organization Profile
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Organization information not available
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
