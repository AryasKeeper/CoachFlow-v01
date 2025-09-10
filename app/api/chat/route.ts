import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
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

// TODO: Configure with actual system prompt for CoachFlow
const SYSTEM_PROMPT = `You are a helpful assistant for CoachFlow, a platform connecting basketball organizations with vetted coaches in Sydney, Australia.

Your role is to:
1. Help organizations create effective job listings
2. Guide coaches through the application process
3. Explain verification requirements (WWCC, insurance, first aid)
4. Provide tips for successful matches
5. Answer questions about the platform

Be friendly, professional, and concise. Focus on practical advice.`

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

  // 5. Generate AI response
  try {
    const result = streamText({
      model: openai('gpt-4o'), // Will use GPT-5 when available
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })
    
    // Stop timer and log success
    const duration = endTimer()
    apiLogger.info('AI chat response generated', {
      userId: user.id,
      duration,
      messageCount: messages.length
    })
    
    return result.toDataStreamResponse()
  } catch (aiError) {
    // Stop timer and log error
    const duration = endTimer()
    apiLogger.error('AI chat generation failed', {
      userId: user.id,
      duration,
      messageCount: messages.length,
      error: aiError instanceof Error ? aiError.message : 'Unknown error'
    })
    
    throw createInternalError('AI service temporarily unavailable', aiError as Error, {
      userId: user.id,
      messageCount: messages.length,
      duration
    })
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

export async function generateStructuredResponse(query: string, context?: ChatContext) {
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
