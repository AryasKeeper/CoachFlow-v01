import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navigation } from './navigation'

describe('Navigation Component', () => {
  it('renders the CoachFlow logo', () => {
    render(<Navigation />)
    
    const logo = screen.getByText('CoachFlow')
    expect(logo).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Navigation />)
    
    const howItWorksLink = screen.getByText('How It Works')
    const pricingLink = screen.getByText('Pricing')
    
    expect(howItWorksLink).toBeInTheDocument()
    expect(pricingLink).toBeInTheDocument()
  })

  it('renders sign in and get started buttons', () => {
    render(<Navigation />)
    
    const signInButton = screen.getByText('Sign In')
    const getStartedButton = screen.getByText('Get Started')
    
    expect(signInButton).toBeInTheDocument()
    expect(getStartedButton).toBeInTheDocument()
  })
})