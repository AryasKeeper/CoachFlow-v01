import { AppError, ErrorSeverity, ErrorCategory, ERROR_CODES } from './types'

export class CoachFlowError extends Error implements AppError {
  public code?: string
  public statusCode?: number
  public severity?: ErrorSeverity
  public category?: ErrorCategory
  public context?: Record<string, unknown>
  public userFacing?: boolean
  public retryable?: boolean

  constructor(
    message: string,
    options: {
      code?: string
      statusCode?: number
      severity?: ErrorSeverity
      category?: ErrorCategory
      context?: Record<string, unknown>
      userFacing?: boolean
      retryable?: boolean
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'CoachFlowError'
    
    this.code = options.code
    this.statusCode = options.statusCode || 500
    this.severity = options.severity || ErrorSeverity.MEDIUM
    this.category = options.category || ErrorCategory.UNKNOWN
    this.context = options.context
    this.userFacing = options.userFacing ?? true
    this.retryable = options.retryable ?? false

    if (options.cause) {
      this.cause = options.cause
      this.stack = options.cause.stack
    }

    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CoachFlowError)
    }
  }
}

// Pre-defined error factory functions
export const createAuthError = (message: string, context?: Record<string, unknown>) =>
  new CoachFlowError(message, {
    code: ERROR_CODES.UNAUTHORIZED,
    statusCode: 401,
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.AUTHENTICATION,
    context,
    userFacing: true,
    retryable: false
  })

export const createForbiddenError = (message: string, context?: Record<string, unknown>) =>
  new CoachFlowError(message, {
    code: ERROR_CODES.FORBIDDEN,
    statusCode: 403,
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.AUTHORIZATION,
    context,
    userFacing: true,
    retryable: false
  })

export const createValidationError = (message: string, field?: string, context?: Record<string, unknown>) =>
  new CoachFlowError(message, {
    code: ERROR_CODES.INVALID_INPUT,
    statusCode: 400,
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.VALIDATION,
    context: { field, ...context },
    userFacing: true,
    retryable: false
  })

export const createNetworkError = (message: string, context?: Record<string, unknown>) =>
  new CoachFlowError(message, {
    code: ERROR_CODES.NETWORK_ERROR,
    statusCode: 503,
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.NETWORK,
    context,
    userFacing: true,
    retryable: true
  })

export const createDatabaseError = (message: string, cause?: Error, context?: Record<string, unknown>) =>
  new CoachFlowError(message, {
    code: ERROR_CODES.DATABASE_ERROR,
    statusCode: 500,
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.DATABASE,
    context,
    userFacing: false,
    retryable: false,
    cause
  })

export const createRateLimitError = (message: string, retryAfter?: number) =>
  new CoachFlowError(message, {
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    statusCode: 429,
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.NETWORK,
    context: { retryAfter },
    userFacing: true,
    retryable: true
  })

export const createNotFoundError = (resource: string, id?: string) =>
  new CoachFlowError(`${resource} not found`, {
    code: ERROR_CODES.RECORD_NOT_FOUND,
    statusCode: 404,
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.DATABASE,
    context: { resource, id },
    userFacing: true,
    retryable: false
  })

export const createInternalError = (message: string, cause?: Error, context?: Record<string, unknown>) =>
  new CoachFlowError(message, {
    code: ERROR_CODES.INTERNAL_ERROR,
    statusCode: 500,
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.UNKNOWN,
    context,
    userFacing: false,
    retryable: false,
    cause
  })