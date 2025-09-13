import { requireRole } from "@/lib/auth/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { MessageThreads } from "./message-threads"
import { MessageSquare } from "lucide-react"

export default async function OrgMessagesPage() {
  const user = await requireRole('org')
  const supabase = await createServerSupabaseClient()
  
  // Fetch message threads with latest message
  const { data: threads } = await supabase
    .from('message_threads')
    .select(`
      *,
      messages(
        content,
        sender_id,
        created_at,
        is_read,
        metadata
      )
    `)
    .contains('participant_ids', [user.id])
    .order('updated_at', { ascending: false })
  
  // Get unread counts
  const { data: notifications } = await supabase
    .from('message_notifications')
    .select('thread_id, unread_count')
    .eq('user_id', user.id)
    .gt('unread_count', 0)
  
  const unreadCounts = notifications?.reduce((acc, n) => {
    acc[n.thread_id] = n.unread_count
    return acc
  }, {} as Record<string, number>) || {}
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
        <p className="text-muted-foreground">
          Communicate with coaches about your listings
        </p>
      </div>
      
      <MessageThreads 
        threads={threads || []} 
        currentUserId={user.id}
        unreadCounts={unreadCounts}
      />
    </div>
  )
}