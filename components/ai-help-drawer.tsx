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

// TODO: Uncomment and configure when AI provider keys are available
// import { useChat } from 'ai/react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AiHelpDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your CoachFlow assistant. I can help you navigate the platform, answer questions about coaching, and guide you through creating listings or applications. How can I help you today?',
      timestamp: new Date()
    }
  ])
  
  // TODO: Replace with actual AI SDK implementation
  // const { messages, input, handleInputChange, handleSubmit } = useChat({
  //   api: '/api/chat',
  //   initialMessages: [
  //     {
  //       id: '1',
  //       role: 'assistant',
  //       content: 'Hi! I\'m your CoachFlow assistant...'
  //     }
  //   ]
  // })
  
  const handleSend = () => {
    if (!input.trim()) return
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    // Simulate AI response (replace with actual AI call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m currently in beta mode. Once the AI integration is complete, I\'ll be able to help you with:\n\n• Finding the right coaches for your needs\n• Creating compelling job listings\n• Understanding the verification process\n• Tips for successful applications\n• And much more!\n\nFor now, please explore the platform or contact support for assistance.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }
  
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
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    message.role === 'user'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about CoachFlow..."
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI assistance powered by GPT-5 (coming soon)
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
