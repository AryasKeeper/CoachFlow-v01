"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/ui/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Send, 
  Archive, 
  MoreVertical,
  Building2,
  CheckCheck
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MessageThreadsProps {
  threads: any[]
  currentUserId: string
  unreadCounts: Record<string, number>
  isCoach?: boolean
}

export function MessageThreads({ threads, currentUserId, unreadCounts, isCoach }: MessageThreadsProps) {
  const supabase = createClient()
  const [selectedThread, setSelectedThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Load messages for selected thread
  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
      markAsRead(selectedThread.id)
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${selectedThread.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `thread_id=eq.${selectedThread.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new])
            scrollToBottom()
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedThread])
  
  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    
    if (data) {
      setMessages(data)
      scrollToBottom()
    }
  }
  
  const markAsRead = async (threadId: string) => {
    await supabase.rpc('mark_messages_as_read', {
      p_thread_id: threadId,
      p_user_id: currentUserId
    })
  }
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return
    
    setIsLoading(true)
    const { error } = await supabase
      .from('messages')
      .insert({
        thread_id: selectedThread.id,
        sender_id: currentUserId,
        content: newMessage.trim()
      })
    
    if (!error) {
      setNewMessage("")
    }
    setIsLoading(false)
  }
  
  const archiveThread = async (threadId: string) => {
    await supabase
      .from('message_threads')
      .update({ status: 'archived' })
      .eq('id', threadId)
    
    // Refresh threads list
    window.location.reload()
  }
  
  const getLastMessage = (thread: any) => {
    const messages = thread.messages || []
    return messages[messages.length - 1]
  }
  
  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(messageDate, 'HH:mm')
    } else if (diffInHours < 168) { // 7 days
      return format(messageDate, 'EEE')
    } else {
      return format(messageDate, 'dd/MM')
    }
  }
  
  const getThreadTitle = (thread: any) => {
    if (isCoach) {
      return thread.listing?.org?.org_profiles?.[0]?.org_name || thread.org?.email || 'Organization'
    }
    return thread.coach?.email || 'Coach'
  }
  
  if (threads.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description={isCoach 
          ? "Messages from organizations will appear here" 
          : "Messages from coaches will appear here when they apply to your listings"}
      />
    )
  }
  
  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Thread List */}
      <div className="md:col-span-1">
        <GlassCard className="h-full p-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2">
              {threads.map((thread) => {
                const lastMessage = getLastMessage(thread)
                const unreadCount = unreadCounts[thread.id] || 0
                const isSelected = selectedThread?.id === thread.id
                
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg mb-2 transition-colors",
                      isSelected 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          <Building2 className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">
                            {getThreadTitle(thread)}
                          </p>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {thread.listing?.title}
                        </p>
                        
                        {lastMessage && (
                          <p className={cn(
                            "text-sm truncate",
                            unreadCount > 0 ? "font-medium" : "text-muted-foreground"
                          )}>
                            {lastMessage.sender_id === currentUserId && "You: "}
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                      
                      {unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </GlassCard>
      </div>
      
      {/* Message Thread */}
      <div className="md:col-span-2">
        {selectedThread ? (
          <GlassCard className="h-full p-0 flex flex-col">
            {/* Thread Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {getThreadTitle(selectedThread)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedThread.listing?.title}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveThread(selectedThread.id)}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          isOwn 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isOwn ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-xs",
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {isOwn && message.is_read && (
                            <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}