import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({}))
}))

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => 
      new Response('data: {"content":"Hello!"}\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    )
  }))
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      }))
    }
  }))
}))

vi.mock('@/lib/monitoring', () => ({
  performanceMonitor: {
    startTimer: vi.fn(() => vi.fn(() => 100)) // Mock timer that returns 100ms
  },
  apiLogger: {
    info: vi.fn(),
    error: vi.fn()
  },
  withPerformanceMonitoring: vi.fn((handler) => handler)
}))

vi.mock('@/lib/error-handling', () => ({
  withErrorHandling: vi.fn((handler) => async (req) => {
    try {
      return await handler(req)
    } catch (error) {
      throw error // Re-throw for test verification
    }
  }),
  createAuthError: vi.fn((message) => new Error(`AUTH: ${message}`)),
  createRateLimitError: vi.fn((message) => new Error(`RATE_LIMIT: ${message}`)),
  createValidationError: vi.fn((message) => new Error(`VALIDATION: ${message}`)),
  createInternalError: vi.fn((message) => new Error(`INTERNAL: ${message}`)),
  errorLogger: {
    logUserAction: vi.fn()
  },
  apiLogger: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

describe('Chat API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clear rate limiting store between tests
    vi.resetModules()
  })

  describe('POST /api/chat', () => {
    it('successfully processes valid chat request', async () => {
      const requestBody = {
        messages: [
          { role: 'user', content: 'Hello, I need help with my coach listing.' }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/event-stream')
    })

    it('validates message structure and content', async () => {
      const testCases = [
        // Missing messages array
        { body: {}, expectedError: 'Messages array required' },
        
        // Empty messages array
        { body: { messages: [] }, expectedError: 'Messages array required' },
        
        // Invalid message format
        { body: { messages: [{ role: 'user' }] }, expectedError: 'Invalid message format' },
        
        // Message too long
        { 
          body: { messages: [{ role: 'user', content: 'a'.repeat(2001) }] }, 
          expectedError: 'Message too long' 
        }
      ]

      for (const testCase of testCases) {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify(testCase.body),
          headers: { 'Content-Type': 'application/json' }
        })

        try {
          await POST(request)
          // If no error is thrown, test should fail
          expect(true).toBe(false)
        } catch (error) {
          expect(error.message).toContain('VALIDATION')
        }
      }
    })

    it('enforces rate limiting per user', async () => {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const mockSupabase = vi.mocked(createServerSupabaseClient)
      
      // Mock consistent user ID
      mockSupabase.mockReturnValue({
        auth: {
          getUser: () => ({
            data: { user: { id: 'rate-limited-user', email: 'test@example.com' } },
            error: null
          })
        }
      } as any)

      const validRequest = {
        messages: [{ role: 'user', content: 'Test message' }]
      }

      // Make requests up to the rate limit (10 requests per hour)
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify(validRequest),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }

      // 11th request should be rate limited
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(validRequest),
        headers: { 'Content-Type': 'application/json' }
      })

      try {
        await POST(request)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.message).toContain('RATE_LIMIT')
      }
    })

    it('requires user authentication', async () => {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const mockSupabase = vi.mocked(createServerSupabaseClient)
      
      // Mock unauthenticated user
      mockSupabase.mockReturnValueOnce({
        auth: {
          getUser: () => ({
            data: { user: null },
            error: new Error('No user session')
          })
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }]
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      try {
        await POST(request)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.message).toContain('AUTH')
      }
    })

    it('logs user activity and performance metrics', async () => {
      const { errorLogger, apiLogger } = await import('@/lib/error-handling')
      const { performanceMonitor } = await import('@/lib/monitoring')

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      await POST(request)

      // Verify logging calls
      expect(errorLogger.logUserAction).toHaveBeenCalledWith(
        'ai_chat_request',
        'test-user-id',
        expect.objectContaining({
          messageCount: 2,
          totalCharacters: expect.any(Number)
        })
      )

      expect(performanceMonitor.startTimer).toHaveBeenCalledWith('ai_chat_generation')
      expect(apiLogger.info).toHaveBeenCalledWith(
        'AI chat request',
        expect.objectContaining({
          userId: 'test-user-id',
          messageCount: 2
        })
      )
    })

    it('handles AI service errors gracefully', async () => {
      const { streamText } = await import('ai')
      const mockStreamText = vi.mocked(streamText)
      
      // Mock AI service failure
      mockStreamText.mockImplementationOnce(() => {
        throw new Error('AI service unavailable')
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }]
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      try {
        await POST(request)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.message).toContain('INTERNAL')
        expect(error.message).toContain('AI service temporarily unavailable')
      }
    })

    it('validates message content length individually', async () => {
      const messages = [
        { role: 'user', content: 'Short message' },
        { role: 'assistant', content: 'a'.repeat(2001) }, // Too long
        { role: 'user', content: 'Another short message' }
      ]

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
        headers: { 'Content-Type': 'application/json' }
      })

      try {
        await POST(request)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.message).toContain('VALIDATION')
        expect(error.message).toContain('Message too long')
      }
    })
  })
})