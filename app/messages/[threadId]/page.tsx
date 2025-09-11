import { requireAuth } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { MessageThread } from "@/components/ui/message-thread"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Building2, User } from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{
    threadId: string
  }>
}

export default async function MessageThreadPage({ params }: PageProps) {
  const { threadId } = await params
  const user = await requireAuth()
  const supabase = await createServerSupabaseClient()
  
  // Check if user has access to this thread
  const { data: hasAccess } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('thread_id', threadId)
    .limit(1)
    .single()
  
  if (!hasAccess) {
    // Try to find if this is a listing/booking the user is involved in
    const { data: listingAccess } = await supabase
      .from('listings')
      .select('org_id')
      .eq('id', threadId)
      .eq('org_id', user.id)
      .single()
    
    const { data: applicationAccess } = await supabase
      .from('applications')
      .select('coach_id')
      .eq('listing_id', threadId)
      .eq('coach_id', user.id)
      .single()
    
    const { data: bookingAccess } = await supabase
      .from('bookings')
      .select('org_id, coach_id')
      .eq('id', threadId)
      .or(`org_id.eq.${user.id},coach_id.eq.${user.id}`)
      .single()
    
    if (!listingAccess && !applicationAccess && !bookingAccess) {
      notFound()
    }
  }
  
  // Get context information
  let context: any = null
  let otherUser: any = null
  let title = "Conversation"
  
  // Check if this is a listing thread
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      status,
      org:users!listings_org_id_fkey(
        id,
        name,
        email,
        org_profiles!inner(org_name)
      )
    `)
    .eq('id', threadId)
    .single()
  
  if (listing) {
    context = {
      type: 'listing',
      listing: listing
    }
    title = listing.title
    
    if (user.role === 'coach') {
      otherUser = {
        name: listing.org.org_profiles.org_name,
        email: listing.org.email
      }
    } else {
      // For org users, find the coach they're talking to
      const { data: application } = await supabase
        .from('applications')
        .select(`
          coach:users!applications_coach_id_fkey(
            id,
            name,
            email
          )
        `)
        .eq('listing_id', threadId)
        .eq('status', 'accepted')
        .single()
      
      if (application) {
        otherUser = application.coach
      }
    }
  }
  
  // Check if this is a booking thread
  if (!context) {
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        listing:listings(
          title
        ),
        org:users!bookings_org_id_fkey(
          id,
          name,
          email,
          org_profiles!inner(org_name)
        ),
        coach:users!bookings_coach_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('id', threadId)
      .single()
    
    if (booking) {
      context = {
        type: 'booking',
        booking: booking
      }
      title = `${booking.listing.title} - Booking`
      
      if (user.role === 'coach') {
        otherUser = {
          name: booking.org.org_profiles.org_name,
          email: booking.org.email
        }
      } else {
        otherUser = booking.coach
      }
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/messages" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to messages
        </Link>
        
        {context && (
          <GlassCard className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {context.type === 'listing' ? (
                    <Building2 className="w-5 h-5 text-primary" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground capitalize">
                    {context.type} conversation
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {context.type}
                </Badge>
                {context.listing && (
                  <Badge 
                    variant={context.listing.status === 'active' ? 'default' : 'outline'}
                  >
                    {context.listing.status}
                  </Badge>
                )}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
      
      {/* Message Thread */}
      <MessageThread
        threadId={threadId}
        currentUserId={user.id}
        otherUser={otherUser}
        title={title}
      />
    </div>
  )
}
