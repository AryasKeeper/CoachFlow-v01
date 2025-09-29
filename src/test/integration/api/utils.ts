import { NextRequest } from 'next/server'
import { expect } from 'vitest'

/**
 * Utility functions for API integration testing
 */

export const createMockRequest = (
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    userId?: string
  } = {}
) => {
  const { method = 'GET', body, headers = {}, userId } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  // Ensure signal is not null for NextRequest compatibility
  if (requestInit.signal === null) {
    delete requestInit.signal
  }
  const request = new NextRequest(url, requestInit as any)
  
  // Add user context to request if provided
  if (userId) {
    ;(request as any).userId = userId
  }

  return request
}

export const createAuthenticatedRequest = (
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    userId?: string
    userRole?: string
  } = {}
) => {
  const { userId = 'test-user-id', userRole = 'user', ...rest } = options
  
  return createMockRequest(url, {
    ...rest,
    userId,
    headers: {
      'Authorization': `Bearer mock-jwt-token`,
      'x-user-id': userId,
      'x-user-role': userRole,
      ...rest.headers
    }
  })
}

export const expectValidationError = (error: unknown, field?: string) => {
  expect(error).toBeInstanceOf(Error)
  const errorMessage = (error as Error).message
  expect(errorMessage).toContain('VALIDATION')
  
  if (field) {
    expect(errorMessage).toContain(field)
  }
}

export const expectAuthError = (error: unknown) => {
  expect(error).toBeInstanceOf(Error)
  expect((error as Error).message).toContain('AUTH')
}

export const expectRateLimitError = (error: unknown) => {
  expect(error).toBeInstanceOf(Error)
  expect((error as Error).message).toContain('RATE_LIMIT')
}

export const expectInternalError = (error: unknown) => {
  expect(error).toBeInstanceOf(Error)
  expect((error as Error).message).toContain('INTERNAL')
}

export const mockUserSession = (
  userId: string = 'test-user-id',
  email: string = 'test@example.com',
  role: string = 'user'
) => ({
  data: { 
    user: { 
      id: userId, 
      email,
      user_metadata: { role }
    } 
  },
  error: null
})

export const mockNoUserSession = () => ({
  data: { user: null },
  error: new Error('No user session')
})

export const waitForMs = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const createLongString = (length: number): string => {
  return 'a'.repeat(length)
}

export const validateResponseStructure = (
  data: any,
  expectedKeys: string[]
): void => {
  for (const key of expectedKeys) {
    expect(data).toHaveProperty(key)
  }
}

export const validateTimestamp = (timestamp: string): void => {
  expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  
  const date = new Date(timestamp)
  expect(date.getTime()).toBeGreaterThan(Date.now() - 10000) // Within last 10 seconds
  expect(date.getTime()).toBeLessThanOrEqual(Date.now())
}