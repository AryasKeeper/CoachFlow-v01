import { render, screen } from '@testing-library/react'
import { PasswordStrength } from '@/components/ui/password-strength'
import { describe, it, expect } from 'vitest'

describe('PasswordStrength Component', () => {
  it('renders nothing when no password is provided', () => {
    const { container } = render(<PasswordStrength password="" />)
    expect(container.firstChild).toBeNull()
  })

  it('shows weak password strength for simple passwords', () => {
    render(<PasswordStrength password="password" />)
    expect(screen.getByText('Weak')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 12 characters long')).toBeInTheDocument()
  })

  it('shows medium password strength for moderately complex passwords', () => {
    render(<PasswordStrength password="Password123!" />)
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('shows strong password strength for complex passwords', () => {
    render(<PasswordStrength password="VeryComplexPassword123!@#$" />)
    expect(screen.getByText('Strong')).toBeInTheDocument()
    expect(screen.getByText('All requirements met')).toBeInTheDocument()
  })

  it('displays specific error messages for password requirements', () => {
    render(<PasswordStrength password="short" />)
    
    expect(screen.getByText('Password must be at least 12 characters long')).toBeInTheDocument()
    expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument()
    expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument()
    expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument()
  })

  it('detects common password patterns', () => {
    render(<PasswordStrength password="Password123456" />)
    expect(screen.getByText('Password contains common patterns and is too predictable')).toBeInTheDocument()
  })

  it('updates progress bar based on password strength', () => {
    const { rerender } = render(<PasswordStrength password="weak" />)
    let progressBar = document.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveStyle({ transform: 'translateX(-75%)' }) // 25% for weak
    
    rerender(<PasswordStrength password="StrongPassword123!" />)
    progressBar = document.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveStyle({ transform: 'translateX(0%)' }) // 100% for strong
  })

  it('applies custom className when provided', () => {
    const { container } = render(<PasswordStrength password="test" className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})