import { describe, it, expect, vi, beforeEach } from 'vitest'
import { errorHandler } from '@/lib/error-handling/error-handler'
import { CoachFlowError, createAuthError, createValidationError } from '@/lib/error-handling/app-error'
import { NextRequest } from 'next/server'

// Mock the error logger
vi.mock('@/lib/error-handling/error-logger', () => ({
  errorLogger: {
    logError: vi.fn()
  }
}))

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleError', () => {
    it('handles CoachFlowError correctly', async () => {
      const error = createAuthError('User not authenticated')
      const mockReq = new NextRequest('http://localhost:3000/test')
      
      const response = await errorHandler.handleError(error, mockReq)
      const responseData = await response.json()
      
      expect(response.status).toBe(401)
      expect(responseData.error.title).toBe('Authentication Required')
      expect(responseData.error.message).toBe('User not authenticated')
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })

    it('handles generic Error with default message', async () => {
      const error = new Error('Generic error')
      const mockReq = new NextRequest('http://localhost:3000/test')
      
      const response = await errorHandler.handleError(error, mockReq)
      const responseData = await response.json()
      
      expect(response.status).toBe(500)
      expect(responseData.error.title).toBe('Something went wrong')
      expect(responseData.error.message).toContain('An unexpected error occurred')
    })

    it('handles network-related errors', async () => {
      const error = new Error('fetch failed: connection timeout')
      const mockReq = new NextRequest('http://localhost:3000/test')
      
      const response = await errorHandler.handleError(error, mockReq)
      const responseData = await response.json()
      
      expect(responseData.error.title).toBe('Connection Error')
      expect(responseData.error.message).toContain('Unable to connect')
    })

    it('handles timeout errors', async () => {
      const error = new Error('Request timeout after 30s')
      const mockReq = new NextRequest('http://localhost:3000/test')
      
      const response = await errorHandler.handleError(error, mockReq)
      const responseData = await response.json()
      
      expect(responseData.error.title).toBe('Request Timeout')
      expect(responseData.error.message).toContain('took too long')
    })
  })

  describe('handleClientError', () => {
    it('returns user-facing error for CoachFlowError', async () => {
      const error = createValidationError('Invalid input', 'email')
      
      const userError = await errorHandler.handleClientError(error)
      
      expect(userError.title).toBe('Invalid Input')
      expect(userError.message).toBe('Invalid input')
      expect(userError.code).toBe('INVALID_INPUT')
    })

    it('sanitizes non-user-facing errors', async () => {
      const error = new Error('Database connection failed with credentials xyz')
      
      const userError = await errorHandler.handleClientError(error)
      
      expect(userError.title).toBe('Something went wrong')
      expect(userError.message).toContain('unexpected error occurred')
      expect(userError.message).not.toContain('Database')
      expect(userError.message).not.toContain('credentials')
    })

    it('includes additional context when provided', async () => {
      const error = new Error('Test error')
      const context = { userId: '123', action: 'login' }
      
      await errorHandler.handleClientError(error, context)
      
      // The context should be logged but not exposed to user
      const userError = await errorHandler.handleClientError(error)
      expect(userError.message).not.toContain('123')
    })
  })

  describe('withErrorHandling wrapper', () => {
    it('executes handler successfully when no error', async () => {
      const { withErrorHandling } = await import('@/lib/error-handling/error-handler')
      
      const mockHandler = vi.fn().mockResolvedValue(new Response('Success', { status: 200 }))
      const mockReq = new NextRequest('http://localhost:3000/test')
      
      const response = await withErrorHandling(mockHandler, mockReq)
      
      expect(mockHandler).toHaveBeenCalledWith(mockReq)
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('Success')
    })

    it('catches and handles errors from handler', async () => {
      const { withErrorHandling } = await import('@/lib/error-handling/error-handler')
      
      const mockHandler = vi.fn().mockRejectedValue(createAuthError('Access denied'))
      const mockReq = new NextRequest('http://localhost:3000/test')
      
      const response = await withErrorHandling(mockHandler, mockReq)
      const responseData = await response.json()
      
      expect(response.status).toBe(401)
      expect(responseData.error.message).toBe('Access denied')
    })

    it('handles non-Error objects thrown by handler', async () => {
      const { withErrorHandling } = await import('@/lib/error-handling/error-handler')
      
      const mockHandler = vi.fn().mockRejectedValue('String error')
      const mockReq = new NextRequest('http://localhost:3000/test')
      
      const response = await withErrorHandling(mockHandler, mockReq)
      const responseData = await response.json()
      
      expect(response.status).toBe(500)
      expect(responseData.error.message).toContain('unexpected error')
    })
  })

  describe('useErrorHandler hook', () => {
    it('returns handleError function', async () => {
      const { useErrorHandler } = await import('@/lib/error-handling/error-handler')
      
      const { handleError } = useErrorHandler()
      
      expect(typeof handleError).toBe('function')
    })

    it('handles error and returns user-facing message', async () => {
      const { useErrorHandler } = await import('@/lib/error-handling/error-handler')
      
      const { handleError } = useErrorHandler()
      const error = createValidationError('Invalid data')
      
      const userError = await handleError(error)
      
      expect(userError.title).toBe('Invalid Input')
      expect(userError.message).toBe('Invalid data')
    })
  })
})