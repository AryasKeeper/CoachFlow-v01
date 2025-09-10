// Main error handling exports
export * from './types'
export * from './app-error'
export * from './error-handler'
export * from './error-logger'

// Re-export commonly used utilities
export {
  errorHandler,
  withErrorHandling,
  useErrorHandler
} from './error-handler'

export {
  CoachFlowError,
  createAuthError,
  createForbiddenError,
  createValidationError,
  createNetworkError,
  createDatabaseError,
  createRateLimitError,
  createNotFoundError,
  createInternalError
} from './app-error'

export { errorLogger } from './error-logger'