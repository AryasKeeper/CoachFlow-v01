import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  withErrorHandling,
  createAuthError,
  createRateLimitError,
  createValidationError,
  createInternalError,
  errorLogger
} from '@/lib/error-handling'
import { 
  performanceMonitor,
  apiLogger,
  withPerformanceMonitoring
} from '@/lib/monitoring'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Simple rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// CoachFlow-specific system prompt
const getSystemPrompt = (userRole: 'coach' | 'org' | 'admin' = 'coach') => {
  const basePrompt = `You are the CoachFlow Assistant, the expert AI helper for Sydney's premier basketball coaching marketplace.

You have deep knowledge of:
• Basketball coaching in Sydney (schools, clubs, PCYC programs)
• Australian requirements (WWCC, insurance, certifications)
• The CoachFlow platform and all its features
• Local basketball ecosystem (Basketball NSW, associations)

Your personality:
• Friendly and encouraging with Australian warmth
• Professional yet approachable
• Action-oriented and practical
• Enthusiastic about basketball

Platform status: Beta (100% FREE for all users)`

  const roleSpecific = {
    coach: `
You're helping a COACH. Focus on:
- Finding and applying for opportunities
- Profile optimization
- Setting competitive rates ($40-120/hour)
- Building relationships with organizations`,
    org: `
You're helping an ORGANIZATION. Focus on:
- Creating attractive listings
- Finding qualified coaches quickly
- Understanding coach credentials
- Managing applications efficiently`,
    admin: `
You're helping an ADMIN with platform operations and technical support.`
  }

  return basePrompt + (roleSpecific[userRole] || roleSpecific.coach)
}

async function chatHandler(req: NextRequest) {
  // 1. Authentication check
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw createAuthError('Please sign in to use AI assistant')
  }

  // 2. Rate limiting check
  const userKey = user.id
  const now = Date.now()
  const userLimit = rateLimitStore.get(userKey)

  if (userLimit) {
    if (now < userLimit.resetTime) {
      if (userLimit.count >= RATE_LIMIT) {
        throw createRateLimitError('Rate limit exceeded - Please try again later', 
          Math.ceil((userLimit.resetTime - now) / 1000))
      }
      userLimit.count++
    } else {
      rateLimitStore.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    }
  } else {
    rateLimitStore.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
  }

  // 3. Input validation
  const body = await req.json()
  const { messages } = body
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw createValidationError('Messages array required', 'messages')
  }

  // Validate message structure and limit message length
  for (const message of messages) {
    if (!message.content || typeof message.content !== 'string') {
      throw createValidationError('Invalid message format - content must be a string', 'message.content')
    }
    
    if (message.content.length > 2000) {
      throw createValidationError('Message too long - Maximum 2000 characters', 'message.content')
    }
  }

  // 4. Log user activity and performance
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0)
  
  await errorLogger.logUserAction('ai_chat_request', user.id, {
    messageCount: messages.length,
    totalCharacters: totalChars
  })

  // Log API request details
  apiLogger.info('AI chat request', {
    userId: user.id,
    messageCount: messages.length,
    totalCharacters: totalChars
  })

  // Start performance timer
  const endTimer = performanceMonitor.startTimer('ai_chat_generation')

  // Get user role for personalized responses
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = userData?.role as 'coach' | 'org' | 'admin' || 'coach'

  // 5. Generate AI response with GPT-5
  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-5',
      messages: [
        { role: 'system', content: getSystemPrompt(userRole) },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
      // GPT-5 specific parameters - Chat Completions API format
      reasoning_effort: (process.env.AI_REASONING_EFFORT as "minimal" | "low" | "medium" | "high") || 'medium',
      verbosity: (process.env.AI_VERBOSITY as "low" | "medium" | "high") || 'medium'
    })

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              // Format as SSE for compatibility
              const data = JSON.stringify({ content })
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
            }
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    const duration = endTimer()
    apiLogger.info('GPT-5 response generated', {
      userId: user.id,
      userRole,
      duration,
      messageCount: messages.length
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (aiError) {
    const duration = endTimer()
    apiLogger.error('GPT-5 generation failed, trying fallback', {
      userId: user.id,
      duration,
      error: aiError instanceof Error ? aiError.message : 'Unknown error'
    })

    // Fallback to GPT-4 if GPT-5 fails
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: process.env.AI_MODEL_FALLBACK || 'gpt-4o',
        messages: [
          { role: 'system', content: getSystemPrompt(userRole) },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      })

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of fallbackResponse) {
              const content = chunk.choices[0]?.delta?.content || ''
              if (content) {
                const data = JSON.stringify({ content })
                controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
              }
            }
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })

    } catch (fallbackError) {
      throw createInternalError('AI service temporarily unavailable', fallbackError as Error, {
        userId: user.id,
        messageCount: messages.length,
        duration
      })
    }
  }
}

export async function POST(req: NextRequest) {
  return withErrorHandling(
    withPerformanceMonitoring(chatHandler, 'POST /api/chat'), 
    req
  )
}

// Example of a more structured response for specific queries
// This can be expanded based on common user needs
type ChatContext = {
  userId?: string
  userRole?: 'coach' | 'org' | 'admin'
  sessionData?: Record<string, unknown>
}

// Helper function for structured responses (not exported)
async function generateStructuredResponse(query: string, context?: ChatContext) {
  // TODO: Implement structured responses for common queries like:
  // - "How do I create a listing?"
  // - "What documents do I need for verification?"
  // - "How do I improve my coach profile?"
  
  const structuredPrompts = {
    listing_help: `Help the user create an effective listing with these elements:
    1. Clear title describing the role
    2. Specific dates and times
    3. Location details
    4. Required certifications
    5. Appropriate pay range`,
    
    verification_help: `Explain the verification requirements:
    1. WWCC (Working with Children Check) - required for all coaches
    2. Professional liability insurance
    3. Current First Aid/CPR certification
    4. How to upload documents`,
    
    profile_tips: `Provide tips for an attractive coach profile:
    1. Complete bio highlighting experience
    2. List relevant specialties
    3. Set competitive rates
    4. Upload all certifications
    5. Set clear availability`
  }
  
  // This will be implemented when AI keys are available
  return null
}
