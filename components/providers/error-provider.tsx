"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { UserFacingError } from '@/lib/error-handling/types'
import { errorHandler } from '@/lib/error-handling/error-handler'

interface ErrorContextType {
  error: UserFacingError | null
  showError: (error: Error, context?: Record<string, unknown>) => Promise<void>
  clearError: () => void
  isLoading: boolean
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [error, setError] = useState<UserFacingError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const showError = async (error: Error, context?: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      const userError = await errorHandler.handleClientError(error, context)
      setError(userError)
    } catch (loggingError) {
      console.error('Failed to handle error:', loggingError)
      // Fallback error display
      setError({
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
        code: 'UNKNOWN_ERROR'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <ErrorContext.Provider value={{ error, showError, clearError, isLoading }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}