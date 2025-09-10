import { NextRequest, NextResponse } from 'next/server'
import { errorLogger } from './error-logger'
import { CoachFlowError } from './app-error'
import { ErrorInfo, UserFacingError, ERROR_CODES } from './types'

class ErrorHandler {
  private static instance: ErrorHandler

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  async handleError(error: Error, req?: NextRequest): Promise<NextResponse> {
    const errorInfo = await this.createErrorInfo(error, req)
    await errorLogger.logError(errorInfo)

    const userError = this.createUserFacingError(error)
    return this.createErrorResponse(userError, errorInfo.statusCode || 500)
  }

  async handleClientError(error: Error, context?: Record<string, unknown>): Promise<UserFacingError> {
    const errorInfo = await this.createErrorInfo(error, undefined, context)
    await errorLogger.logError(errorInfo)

    return this.createUserFacingError(error)
  }

  private async createErrorInfo(
    error: Error, 
    req?: NextRequest, 
    additionalContext?: Record<string, unknown>
  ): Promise<ErrorInfo> {
    const appError = error instanceof CoachFlowError ? error : null
    
    const context = {
      ...additionalContext,
      ...(appError?.context || {}),
      originalError: error.constructor.name,
      ...(req && {
        method: req.method,
        headers: this.sanitizeHeaders(req.headers),
        ip: this.getClientIP(req)
      })
    }

    return {
      message: error.message,
      code: appError?.code,
      statusCode: appError?.statusCode || 500,
      timestamp: new Date(),
      url: req?.url,
      userAgent: req?.headers.get('user-agent') || undefined,
      stack: error.stack,
      context
    }
  }

  private createUserFacingError(error: Error): UserFacingError {
    if (error instanceof CoachFlowError && error.userFacing) {
      return {
        title: this.getErrorTitle(error.code),
        message: error.message,
        code: error.code
      }
    }

    // Default user-friendly messages for different error types
    if (error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to our services. Please check your internet connection and try again.',
        code: ERROR_CODES.NETWORK_ERROR
      }
    }

    if (error.message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        code: ERROR_CODES.TIMEOUT
      }
    }

    // Generic fallback
    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      code: ERROR_CODES.UNKNOWN_ERROR
    }
  }

  private getErrorTitle(code?: string): string {
    switch (code) {
      case ERROR_CODES.UNAUTHORIZED:
        return 'Authentication Required'
      case ERROR_CODES.FORBIDDEN:
        return 'Access Denied'
      case ERROR_CODES.INVALID_INPUT:
        return 'Invalid Input'
      case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        return 'Too Many Requests'
      case ERROR_CODES.NETWORK_ERROR:
        return 'Connection Error'
      case ERROR_CODES.SERVICE_UNAVAILABLE:
        return 'Service Unavailable'
      case ERROR_CODES.DATABASE_ERROR:
        return 'Service Error'
      case ERROR_CODES.RECORD_NOT_FOUND:
        return 'Not Found'
      default:
        return 'Error'
    }
  }

  private createErrorResponse(userError: UserFacingError, statusCode: number): NextResponse {
    return NextResponse.json(
      {
        error: {
          title: userError.title,
          message: userError.message,
          code: userError.code
        }
      },
      { status: statusCode }
    )
  }

  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {}
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']

    headers.forEach((value, key) => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    })

    return sanitized
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return req.headers.get('x-real-ip') || 
           req.headers.get('cf-connecting-ip') || 
           'unknown'
  }
}

export const errorHandler = ErrorHandler.getInstance()

// Utility function for API route error handling
export async function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>,
  req: NextRequest
): Promise<NextResponse> {
  try {
    return await handler(req)
  } catch (error) {
    console.error('API Route Error:', error)
    return errorHandler.handleError(error instanceof Error ? error : new Error(String(error)), req)
  }
}

// React hook for client-side error handling
export function useErrorHandler() {
  const handleError = async (error: Error, context?: Record<string, unknown>) => {
    const userError = await errorHandler.handleClientError(error, context)
    
    // You can integrate with a toast/notification system here
    console.error('Client Error:', userError)
    
    return userError
  }

  return { handleError }
}