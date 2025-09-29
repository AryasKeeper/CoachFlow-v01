import { render } from '@testing-library/react'
import { screen, fireEvent } from '@testing-library/dom'
import { ErrorBoundary } from '@/components/error-boundary'
import { describe, it, expect, vi } from 'vitest'

// Mock the error logger
vi.mock('@/lib/error-handling', () => ({
  errorLogger: {
    logError: vi.fn()
  }
}))

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('shows error details when showDetails is true', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getAllByText(/Error ID:/).length).toBeGreaterThan(0)
    
    consoleSpy.mockRestore()
  })

  it('renders custom fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const customFallback = <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('provides retry functionality', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    })
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)
    
    expect(mockReload).toHaveBeenCalledOnce()
    
    consoleSpy.mockRestore()
  })

  it('provides go home functionality', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window.location
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const homeButton = screen.getByText('Go Home')
    fireEvent.click(homeButton)
    
    expect(mockLocation.href).toBe('/')
    
    consoleSpy.mockRestore()
  })

  it('provides error reporting functionality', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window.open
    const mockOpen = vi.fn()
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    })
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const reportButton = screen.getByText('Report Issue')
    fireEvent.click(reportButton)
    
    expect(mockOpen).toHaveBeenCalled()
    const callArg = mockOpen.mock.calls[0][0] as string
    expect(callArg).toContain('mailto:support@coachflow.app')
    expect(callArg).toContain('Error Report')
    
    consoleSpy.mockRestore()
  })
})