import { requireAuth } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import Link from "next/link"

export default async function MessagesPage() {
  const user = await requireAuth()
  const supabase = await createServerSupabaseClient()
  
  // Get message threads for the current user
  const { data: messageThreads } = await supabase
    .rpc('get_user_message_threads', { user_id: user.id })
  
  // Since we don't have the RPC function yet, let's get threads manually
  // by finding distinct thread_ids where user is involved
  const { data: userThreads } = await supabase
    .from('messages')
    .select(`
      thread_id,
      created_at,
      body,
      sender:users!messages_sender_id_fkey(
        id,
        name,
        email,
        role
      )
    `)
    .or(`sender_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
  
  // Group messages by thread_id and get the latest message for each
  const threadMap = new Map()
  userThreads?.forEach(message => {
    if (!threadMap.has(message.thread_id) || 
        new Date(message.created_at) > new Date(threadMap.get(message.thread_id).created_at)) {
      threadMap.set(message.thread_id, message)
    }
  })
  
  const threads = Array.from(threadMap.values())
  
  // Get thread contexts (listings/bookings) for each thread
  const threadsWithContext = await Promise.all(
    threads.map(async (thread) => {
      // Try to find if thread_id matches a listing
      const { data: listing } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          org:users!listings_org_id_fkey(
            id,
            name,
            org_profiles!inner(org_name)
          )
        `)
        .eq('id', thread.thread_id)
        .single()
      
      if (listing) {
        return {
          ...thread,
          context: {
            type: 'listing',
            title: listing.title,
            organization: listing.org.org_profiles.org_name
          }
        }
      }
      
      // Try to find if thread_id matches a booking
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          id,
          listing:listings(
            title,
            org:users!listings_org_id_fkey(
              org_profiles!inner(org_name)
            )
          ),
          coach:users!bookings_coach_id_fkey(
            name
          )
        `)
        .eq('id', thread.thread_id)
        .single()
      
      if (booking) {
        return {
          ...thread,
          context: {
            type: 'booking',
            title: booking.listing.title,
            organization: booking.listing.org.org_profiles.org_name,
            coach: booking.coach.name
          }
        }
      }
      
      return {
        ...thread,
        context: {
          type: 'direct',
          title: 'Direct Message'
        }
      }
    })
  )
  
  function formatMessageTime(dateString: string) {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }
  
  function getInitials(name: string | null, email: string) {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email[0].toUpperCase()
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate directly with organizations and coaches
        </p>
      </div>
      
      {threads.length > 0 ? (
        <div className="space-y-4">
          {threadsWithContext.map((thread) => (
            <Link key={thread.thread_id} href={`/messages/${thread.thread_id}`}>
              <GlassCard className="p-4 hover:shadow-soft-lg transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarFallback>
                      {getInitials(thread.sender?.name || null, thread.sender?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold truncate">
                          {thread.context.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {thread.sender?.id === user.id ? 'You' : (thread.sender?.name || thread.sender?.email)}
                          {thread.context.organization && ` • ${thread.context.organization}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {thread.context.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(thread.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.sender?.id === user.id ? 'You: ' : ''}
                      {thread.body}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Your conversations with organizations and coaches will appear here"
        />
      )}
    </div>
  )
}
