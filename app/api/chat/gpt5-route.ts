import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  withErrorHandling,
  createAuthError,
  createRateLimitError,
  createValidationError,
  createInternalError
} from '@/lib/error-handling'
import {
  performanceMonitor,
  apiLogger,
  withPerformanceMonitoring
} from '@/lib/monitoring'
import OpenAI from 'openai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Rate limiting configuration
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30 // More generous for beta testing
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour

// CoachFlow-specific system prompts based on user role
const getSystemPrompt = (userRole: 'coach' | 'org' | 'admin' = 'coach') => {
  const basePrompt = `You are the CoachFlow Assistant, an expert AI helper for Sydney's premier basketball coaching marketplace. You have deep knowledge of:
- Basketball coaching in Sydney (clubs, schools, PCYC programs)
- Australian coaching requirements (WWCC, insurance, certifications)
- Platform features and best practices
- Local basketball ecosystem (Basketball NSW, associations)

Your personality:
- Friendly and encouraging, with Australian colloquialisms when appropriate
- Professional yet approachable
- Action-oriented and practical
- Enthusiastic about basketball and coaching

Current platform status: Beta (100% FREE for all users)`

  const roleSpecific = {
    coach: `
You're speaking with a COACH. Focus on:
- Finding and applying for opportunities
- Profile optimization for better matches
- Understanding requirements and certifications
- Setting competitive rates ($40-120/hour typical)
- Building relationships with organizations
- Using platform features (settings, notifications, messaging)

Common coach questions:
- "How do I stand out to organizations?"
- "What certifications do I need?"
- "How do I set my rates?"
- "When will I hear back about applications?"`,

    org: `
You're speaking with an ORGANIZATION. Focus on:
- Creating attractive job listings
- Finding qualified coaches quickly
- Understanding coach credentials
- Managing applications efficiently
- Booking and scheduling coaches
- Platform features for organizations

Common organization questions:
- "How do I attract quality coaches?"
- "What should I include in my listing?"
- "How are coaches verified?"
- "Can I message coaches before accepting?"`,

    admin: `
You're speaking with an ADMIN. Provide technical and operational insights about:
- Platform metrics and performance
- User management and support
- System configuration
- Feature rollout and testing
- Database and infrastructure`
  }

  return basePrompt + (roleSpecific[userRole] || roleSpecific.coach)
}

// Structured response types for common queries
interface StructuredResponse {
  type: 'listing_help' | 'verification_guide' | 'profile_tips' | 'rate_guidance' | 'platform_navigation'
  title: string
  steps?: string[]
  tips?: string[]
  requirements?: string[]
  resources?: { name: string; url?: string }[]
}

// Generate structured responses for common queries
const getStructuredResponse = (query: string): StructuredResponse | null => {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('listing') || lowerQuery.includes('post') || lowerQuery.includes('job')) {
    return {
      type: 'listing_help',
      title: 'Creating an Effective Listing',
      steps: [
        'Click "Post Opportunity" from your dashboard',
        'Add a clear, specific title (e.g., "U14 Boys Basketball Coach - Saturday Mornings")',
        'Include dates, times, and location (suburb level)',
        'Specify required certifications (WWCC is mandatory)',
        'Set a competitive pay range ($40-120/hour)',
        'Mention any gender preferences if needed',
        'Add details about your program and culture'
      ],
      tips: [
        'Listings with specific times get 3x more applications',
        'Include "urgent" tag for immediate needs',
        'Mention if you provide equipment or uniforms'
      ]
    }
  }

  if (lowerQuery.includes('verification') || lowerQuery.includes('wwcc') || lowerQuery.includes('document')) {
    return {
      type: 'verification_guide',
      title: 'Verification Requirements',
      requirements: [
        'Working With Children Check (WWCC) - NSW mandatory',
        'Public Liability Insurance (min $20M coverage)',
        'Current First Aid & CPR Certificate',
        'Basketball Australia Level 1 Coach Accreditation (preferred)',
        'Valid driver\'s license (if traveling to venues)'
      ],
      steps: [
        'Go to Settings → Account',
        'Upload documents in the Credentials section',
        'Documents are verified within 24 hours',
        'Green checkmark appears once verified'
      ],
      resources: [
        { name: 'Apply for WWCC', url: 'https://www.kidsguardian.nsw.gov.au/check' },
        { name: 'Basketball Australia Courses', url: 'https://www.basketball.net.au/coaching/' }
      ]
    }
  }

  if (lowerQuery.includes('rate') || lowerQuery.includes('pay') || lowerQuery.includes('salary')) {
    return {
      type: 'rate_guidance',
      title: 'Setting Your Coaching Rates',
      tips: [
        'New coaches: $40-60/hour',
        'Experienced coaches (3+ years): $60-80/hour',
        'Elite/Representative coaches: $80-120/hour',
        'School programs typically pay $50-70/hour',
        'PCYC programs: $45-65/hour',
        'Private/elite clubs: $70-120/hour'
      ],
      steps: [
        'Go to Settings → Availability',
        'Set your hourly rate',
        'You can negotiate different rates per opportunity'
      ]
    }
  }

  return null
}

async function chatHandler(req: NextRequest) {
  // 1. Authentication check
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createAuthError('Please sign in to use the AI assistant')
  }

  // Get user role for context-aware responses
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = userData?.role as 'coach' | 'org' | 'admin' || 'coach'

  // 2. Rate limiting
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
  const { messages, useStructured = true } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw createValidationError('Messages array required', 'messages')
  }

  // Validate and limit message length
  for (const message of messages) {
    if (!message.content || typeof message.content !== 'string') {
      throw createValidationError('Invalid message format', 'message.content')
    }
    if (message.content.length > 4000) { // Increased for GPT-5
      throw createValidationError('Message too long - Maximum 4000 characters', 'message.content')
    }
  }

  // 4. Check for structured response first
  if (useStructured && messages.length === 1) {
    const structured = getStructuredResponse(messages[0].content)
    if (structured) {
      return NextResponse.json({
        role: 'assistant',
        content: formatStructuredResponse(structured),
        structured: structured
      })
    }
  }

  // 5. Log activity
  const endTimer = performanceMonitor.startTimer('ai_chat_gpt5')

  apiLogger.info('GPT-5 chat request', {
    userId: user.id,
    userRole,
    messageCount: messages.length
  })

  // 6. Call GPT-5 with Responses API
  try {
    // Using the new Responses API format
    const response = await openai.chat.completions.create({
      model: 'gpt-5', // Using GPT-5 model
      messages: [
        { role: 'system', content: getSystemPrompt(userRole) },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000, // Increased for GPT-5
      stream: true,
      // GPT-5 specific parameters
      response_format: { type: 'text' },
      // @ts-ignore - New GPT-5 parameters
      verbosity: 'medium', // low, medium, high
      reasoning_effort: 'medium' // minimal, medium, high
    })

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(new TextEncoder().encode(content))
            }
          }
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
      duration
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
    apiLogger.error('GPT-5 generation failed', {
      userId: user.id,
      userRole,
      duration,
      error: aiError instanceof Error ? aiError.message : 'Unknown error'
    })

    // Fallback to GPT-4 if GPT-5 fails
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
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
                controller.enqueue(new TextEncoder().encode(content))
              }
            }
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
        userRole,
        duration
      })
    }
  }
}

// Format structured response for display
function formatStructuredResponse(response: StructuredResponse): string {
  let formatted = `## ${response.title}\n\n`

  if (response.steps) {
    formatted += '### Steps:\n'
    response.steps.forEach((step, i) => {
      formatted += `${i + 1}. ${step}\n`
    })
    formatted += '\n'
  }

  if (response.requirements) {
    formatted += '### Requirements:\n'
    response.requirements.forEach(req => {
      formatted += `• ${req}\n`
    })
    formatted += '\n'
  }

  if (response.tips) {
    formatted += '### 💡 Tips:\n'
    response.tips.forEach(tip => {
      formatted += `• ${tip}\n`
    })
    formatted += '\n'
  }

  if (response.resources) {
    formatted += '### Resources:\n'
    response.resources.forEach(resource => {
      formatted += resource.url
        ? `• [${resource.name}](${resource.url})\n`
        : `• ${resource.name}\n`
    })
  }

  return formatted
}

export async function POST(req: NextRequest) {
  return withErrorHandling(
    withPerformanceMonitoring(chatHandler, 'POST /api/chat/gpt5'),
    req
  )
}

// Export structured response generator for use in other parts of the app
export { getStructuredResponse, formatStructuredResponse }