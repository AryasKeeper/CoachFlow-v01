"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Send,
  MessageCircle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime, formatDateTime } from "@/lib/date-utils"

interface Message {
  id: string
  thread_id: string
  sender_id: string
  body: string
  created_at: string
  sender?: {
    name: string | null
    email: string
  }
}

interface MessageThreadProps {
  threadId: string
  currentUserId: string
  otherUser?: {
    name: string | null
    email: string
  }
  title?: string
}

export function MessageThread({ threadId, currentUserId, otherUser, title }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  
  useEffect(() => {
    loadMessages()
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, supabase])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            name,
            email
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      setError('Failed to load messages')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function sendMessage() {
    if (!newMessage.trim() || isSending) return
    
    setIsSending(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: currentUserId,
          body: newMessage.trim()
        })
      
      if (error) throw error
      setNewMessage("")
    } catch (err) {
      setError('Failed to send message')
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }
  
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  function formatMessageTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (messageDay.getTime() === today.getTime()) {
      return `Today ${formatTime(date)}`
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return `Yesterday ${formatTime(date)}`
    } else {
      return formatDateTime(date)
    }
  }
  
  function getInitials(name: string | null, email: string) {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email[0].toUpperCase()
  }
  
  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </GlassCard>
    )
  }
  
  return (
    <GlassCard className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">
              {title || (otherUser ? otherUser.name || otherUser.email : 'Conversation')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          Active
        </Badge>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.sender_id === currentUserId ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(message.sender?.name || null, message.sender?.email || 'U')}
                </AvatarFallback>
              </Avatar>
              
              <div
                className={cn(
                  "max-w-[70%] space-y-1",
                  message.sender_id === currentUserId ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 break-words",
                    message.sender_id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatMessageTime(message.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4">
        {error && (
          <div className="mb-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex gap-2"
        >
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </GlassCard>
  )
}
