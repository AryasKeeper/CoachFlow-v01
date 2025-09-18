"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle,
  Send,
  Sparkles,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { parseMarkdown } from "@/lib/markdown-parser"

import { useCoachflowChat } from '@/hooks/use-coachflow-chat'

export function AiHelpDrawer() {
  const [isOpen, setIsOpen] = useState(false)

  // Use the CoachFlow AI assistant
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useCoachflowChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: `G'day! 👋 I'm your **CoachFlow Assistant**.

I'm here to help you with:
• 🔍 **Finding coaching opportunities** (for coaches)
• 📝 **Creating standout listings** (for organizations)
• ✅ **Understanding verification requirements**
• 💰 **Setting competitive rates** ($40-120/hour typical)
• 🏀 **Navigating the platform** features
• 🏐 **Sydney basketball** ecosystem insights

During our beta, everything is *100% FREE!* How can I help you today?`,
        createdAt: new Date()
      }
    ],
    onError: (error) => {
      console.error('CoachFlow AI Error:', error)
    }
  })
  
  return (
    <>
      {/* Floating Help Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Open help assistant</span>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>CoachFlow Assistant</SheetTitle>
                  <Badge variant="secondary" className="mt-1">Beta</Badge>
                </div>
              </div>
            </div>
          </SheetHeader>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="text-sm">
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      parseMarkdown(message.content)
                    )}
                  </div>
                  {message.createdAt && (
                    <p className={cn(
                      "text-xs mt-1",
                      message.role === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                  <div className="flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce" style={{ animationDelay: '100ms' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '200ms' }}>•</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="border-t p-4">
            <form
              onSubmit={handleSubmit}
              className="flex gap-2"
            >
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about rates, listings, verification, or anything else..."
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-muted-foreground">
                Beta Mode
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
