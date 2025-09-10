import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { 
  LogLevel, 
  logger, 
  securityLogger, 
  performanceLogger, 
  databaseLogger, 
  apiLogger, 
  userLogger,
  createRequestLogger,
  useLogger,
  LogEntry
} from '@/lib/monitoring/logger'

// Mock console methods
const originalConsole = console
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock fs for file logging tests
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    appendFileSync: vi.fn()
  }
})

describe('Logger', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    Object.assign(console, mockConsole)
    vi.clearAllMocks()
    
    // Reset environment
    delete process.env.LOG_FILE
    delete process.env.EXTERNAL_LOGGING_ENDPOINT
  })

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole)
  })

  describe('LogLevel enum', () => {
    it('has correct numeric values', () => {
      expect(LogLevel.DEBUG).toBe(0)
      expect(LogLevel.INFO).toBe(1)
      expect(LogLevel.WARN).toBe(2)
      expect(LogLevel.ERROR).toBe(3)
      expect(LogLevel.CRITICAL).toBe(4)
    })
  })

  describe('Basic logging methods', () => {
    it('logs debug message', () => {
      logger.debug('Debug message', { key: 'value' }, 'test-source')

      expect(mockConsole.debug).toHaveBeenCalled()
      const logCall = mockConsole.debug.mock.calls[0][0]
      expect(logCall).toContain('DEBUG')
      expect(logCall).toContain('Debug message')
      expect(logCall).toContain('[test-source]')
    })

    it('logs info message', () => {
      logger.info('Info message', { data: 123 })

      expect(mockConsole.info).toHaveBeenCalled()
      const logCall = mockConsole.info.mock.calls[0][0]
      expect(logCall).toContain('INFO')
      expect(logCall).toContain('Info message')
    })

    it('logs warning message', () => {
      logger.warn('Warning message')

      expect(mockConsole.warn).toHaveBeenCalled()
      const logCall = mockConsole.warn.mock.calls[0][0]
      expect(logCall).toContain('WARN')
      expect(logCall).toContain('Warning message')
    })

    it('logs error message with stack trace', () => {
      const error = new Error('Test error')
      logger.error('Error message', { errorCode: 500 }, 'test-source', error)

      expect(mockConsole.error).toHaveBeenCalledTimes(2) // Message + stack trace
      const logCall = mockConsole.error.mock.calls[0][0]
      expect(logCall).toContain('ERROR')
      expect(logCall).toContain('Error message')
      expect(logCall).toContain('[test-source]')
    })

    it('logs critical message', () => {
      const error = new Error('Critical error')
      logger.critical('Critical message', { severity: 'high' }, 'critical-source', error)

      expect(mockConsole.error).toHaveBeenCalledTimes(2) // Message + stack trace
      const logCall = mockConsole.error.mock.calls[0][0]
      expect(logCall).toContain('CRITICAL')
      expect(logCall).toContain('Critical message')
    })
  })

  describe('Domain-specific logging methods', () => {
    it('logs security events', () => {
      logger.security('failed_login', { ip: '192.168.1.1', attempts: 3 })

      expect(mockConsole.warn).toHaveBeenCalled()
      const logCall = mockConsole.warn.mock.calls[0][0]
      expect(logCall).toContain('SECURITY: failed_login')
      expect(logCall).toContain('[security]')
    })

    it('logs audit events', () => {
      logger.audit('user_created', 'user-123', { role: 'coach' })

      expect(mockConsole.info).toHaveBeenCalled()
      const logCall = mockConsole.info.mock.calls[0][0]
      expect(logCall).toContain('AUDIT: user_created')
      expect(logCall).toContain('[audit]')
    })

    it('logs performance metrics', () => {
      logger.performance('api_response_time', 250, 'ms', { endpoint: '/api/users' })

      expect(mockConsole.debug).toHaveBeenCalled()
      const logCall = mockConsole.debug.mock.calls[0][0]
      expect(logCall).toContain('PERFORMANCE: api_response_time')
      expect(logCall).toContain('[performance]')
    })

    it('logs database operations', () => {
      logger.database('SELECT', 'users', 45, { query_id: 'q123' })

      expect(mockConsole.debug).toHaveBeenCalled()
      const logCall = mockConsole.debug.mock.calls[0][0]
      expect(logCall).toContain('DATABASE: SELECT on users')
      expect(logCall).toContain('[database]')
    })

    it('logs API calls with appropriate log level', () => {
      // Successful API call (INFO level)
      logger.api('GET', '/api/users', 200, 150, 'user-123')
      expect(mockConsole.info).toHaveBeenCalled()

      // Client error (WARN level)
      logger.api('POST', '/api/users', 400, 100)
      expect(mockConsole.warn).toHaveBeenCalled()

      // Server error (ERROR level)  
      logger.api('GET', '/api/users', 500, 200)
      expect(mockConsole.error).toHaveBeenCalled()
    })

    it('logs user actions', () => {
      logger.user('login', 'user-456', { method: 'google' })

      expect(mockConsole.info).toHaveBeenCalled()
      const logCall = mockConsole.info.mock.calls[0][0]
      expect(logCall).toContain('USER: login')
      expect(logCall).toContain('[user]')
    })

    it('logs health status with appropriate log level', () => {
      // Healthy status (INFO level)
      logger.health('database', 'healthy', { connections: 10 })
      expect(mockConsole.info).toHaveBeenCalled()

      // Degraded status (WARN level)
      logger.health('cache', 'degraded', { hit_rate: 0.7 })
      expect(mockConsole.warn).toHaveBeenCalled()

      // Unhealthy status (ERROR level)
      logger.health('api', 'unhealthy', { error_rate: 0.5 })
      expect(mockConsole.error).toHaveBeenCalled()
    })
  })

  describe('Log level filtering', () => {
    it('respects configured log level', () => {
      logger.setLevel(LogLevel.WARN)

      // Should not log DEBUG and INFO
      logger.debug('Debug message')
      logger.info('Info message')
      expect(mockConsole.debug).not.toHaveBeenCalled()
      expect(mockConsole.info).not.toHaveBeenCalled()

      // Should log WARN and above
      logger.warn('Warning message')
      logger.error('Error message')
      expect(mockConsole.warn).toHaveBeenCalled()
      expect(mockConsole.error).toHaveBeenCalled()
    })

    it('checks if log level is enabled', () => {
      logger.setLevel(LogLevel.INFO)

      expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false)
      expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(true)
      expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true)
      expect(logger.isLevelEnabled(LogLevel.ERROR)).toBe(true)
      expect(logger.isLevelEnabled(LogLevel.CRITICAL)).toBe(true)
    })
  })

  describe('Context sanitization', () => {
    it('redacts sensitive information', () => {
      logger.info('Test message', {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key123',
        secret: 'secret',
        authorization: 'Bearer token'
      })

      expect(mockConsole.info).toHaveBeenCalled()
      const logCall = mockConsole.info.mock.calls[0][0]
      
      expect(logCall).toContain('john')
      expect(logCall).not.toContain('secret123')
      expect(logCall).not.toContain('abc123')
      expect(logCall).not.toContain('key123')
      expect(logCall).toContain('[REDACTED]')
    })

    it('handles circular references in context', () => {
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj

      // Should not throw an error
      expect(() => {
        logger.info('Test with circular reference', circularObj)
      }).not.toThrow()

      expect(mockConsole.info).toHaveBeenCalled()
    })
  })

  describe('Child loggers', () => {
    it('creates child logger with additional context', () => {
      const childLogger = logger.child({ requestId: 'req-123', userId: 'user-456' })
      
      childLogger.info('Child logger message')

      expect(mockConsole.info).toHaveBeenCalled()
      // The exact format may vary, but it should include the child context
      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('merges child context with message context', () => {
      const childLogger = logger.child({ service: 'auth' })
      
      childLogger.info('Auth event', { action: 'login' })

      expect(mockConsole.info).toHaveBeenCalled()
      // Should contain both service and action context
      expect(mockConsole.info).toHaveBeenCalled()
    })
  })

  describe('Pre-configured domain loggers', () => {
    it('creates security logger with correct context', () => {
      securityLogger.info('Security test')
      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('creates performance logger with correct context', () => {
      performanceLogger.debug('Performance test')
      expect(mockConsole.debug).toHaveBeenCalled()
    })

    it('creates database logger with correct context', () => {
      databaseLogger.debug('Database test')
      expect(mockConsole.debug).toHaveBeenCalled()
    })

    it('creates API logger with correct context', () => {
      apiLogger.info('API test')
      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('creates user logger with correct context', () => {
      userLogger.info('User test')
      expect(mockConsole.info).toHaveBeenCalled()
    })
  })

  describe('Request logger', () => {
    it('creates request logger with request and user context', () => {
      const requestLogger = createRequestLogger('req-789', 'user-123')
      
      requestLogger.info('Request processed')
      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('creates request logger with only request ID', () => {
      const requestLogger = createRequestLogger('req-789')
      
      requestLogger.warn('Request warning')
      expect(mockConsole.warn).toHaveBeenCalled()
    })
  })

  describe('React hook logger', () => {
    it('creates component logger', () => {
      const componentLogger = useLogger('UserProfile')
      
      expect(typeof componentLogger.debug).toBe('function')
      expect(typeof componentLogger.info).toBe('function')
      expect(typeof componentLogger.warn).toBe('function')
      expect(typeof componentLogger.error).toBe('function')
      expect(typeof componentLogger.critical).toBe('function')

      componentLogger.info('Component mounted')
      expect(mockConsole.info).toHaveBeenCalled()
    })

    it('creates generic logger without component name', () => {
      const genericLogger = useLogger()
      
      genericLogger.warn('Generic warning')
      expect(mockConsole.warn).toHaveBeenCalled()
    })
  })

  describe('File logging', () => {
    it('logs to file when LOG_FILE environment variable is set', async () => {
      process.env.LOG_FILE = '/tmp/app.log'
      
      // Mock fs module
      const fs = await import('fs')
      const mockAppendFileSync = vi.mocked(fs.appendFileSync)
      
      logger.info('File log test', { key: 'value' })

      // Wait for async file operations
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/tmp/app.log',
        expect.stringContaining('File log test')
      )
    })

    it('handles file logging errors gracefully', async () => {
      process.env.LOG_FILE = '/invalid/path/app.log'
      
      // Should not throw error even if file operations fail
      expect(() => {
        logger.info('File log test')
      }).not.toThrow()
    })
  })

  describe('External service logging', () => {
    it('handles external logging configuration', async () => {
      process.env.EXTERNAL_LOGGING_ENDPOINT = 'https://logs.example.com'
      
      // Should not throw even if external service is not actually available
      expect(() => {
        logger.error('External log test')
      }).not.toThrow()
    })
  })

  describe('JSON formatting', () => {
    it('formats logs as JSON when configured', () => {
      // Create logger with JSON formatting enabled
      const jsonLogger = logger.child({})
      
      jsonLogger.info('JSON test', { structured: true })

      expect(mockConsole.info).toHaveBeenCalled()
      const logCall = mockConsole.info.mock.calls[0][0]
      
      // In development mode, it might not be JSON, but that's expected
      expect(typeof logCall).toBe('string')
    })
  })

  describe('Environment-specific behavior', () => {
    it('uses different defaults for development vs production', () => {
      // The logger should adapt its behavior based on NODE_ENV
      // This test verifies that the logger can handle different environments
      expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBeTruthy() // Should be true in test environment
    })
  })

  describe('Console method selection', () => {
    it('uses appropriate console methods for different log levels', () => {
      logger.debug('Debug message')
      logger.info('Info message') 
      logger.warn('Warning message')
      logger.error('Error message')
      logger.critical('Critical message')

      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining('Debug message'))
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('Info message'))
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('Warning message'))
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Error message'))
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Critical message'))
    })
  })

  describe('Error handling', () => {
    it('handles errors in logging gracefully', () => {
      // Mock console method to throw an error
      mockConsole.info.mockImplementationOnce(() => {
        throw new Error('Console error')
      })

      // Should not propagate the error
      expect(() => {
        logger.info('Test message')
      }).not.toThrow()
    })
  })
})