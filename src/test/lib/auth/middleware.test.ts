import { describe, it, expect } from 'vitest'
import { validatePassword, sanitizeAuthInput, validateEmail } from '@/lib/auth/middleware'

describe('Auth Middleware', () => {
  describe('validatePassword', () => {
    it('validates a strong password correctly', () => {
      const result = validatePassword('StrongPassword123!@#')
      
      expect(result.isValid).toBe(true)
      expect(result.strength).toBe('strong')
      expect(result.errors).toHaveLength(0)
    })

    it('rejects password that is too short', () => {
      const result = validatePassword('Short1!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 12 characters long')
    })

    it('requires uppercase letters', () => {
      const result = validatePassword('lowercase123!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('requires lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('requires numbers', () => {
      const result = validatePassword('PasswordOnly!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('requires special characters', () => {
      const result = validatePassword('Password123')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('detects common patterns', () => {
      const result = validatePassword('Password123456!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password contains common patterns and is too predictable')
    })

    it('detects repeated characters', () => {
      const result = validatePassword('Passwordddd123!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password contains common patterns and is too predictable')
    })

    it('scores medium strength password correctly', () => {
      const result = validatePassword('GoodPassword1!')
      
      expect(result.isValid).toBe(true)
      expect(result.strength).toBe('medium')
    })

    it('identifies weak but valid password', () => {
      const result = validatePassword('SimplePass1!')
      
      expect(result.isValid).toBe(false) // Should be invalid if strength is weak
      expect(result.strength).toBe('weak')
    })
  })

  describe('sanitizeAuthInput', () => {
    it('trims whitespace', () => {
      const result = sanitizeAuthInput('  test@example.com  ')
      expect(result).toBe('test@example.com')
    })

    it('removes basic XSS characters', () => {
      const result = sanitizeAuthInput('test<script>alert("xss")</script>')
      expect(result).toBe('testscriptalert("xss")/script')
    })

    it('limits input length', () => {
      const longInput = 'a'.repeat(300)
      const result = sanitizeAuthInput(longInput)
      expect(result.length).toBe(254)
    })

    it('handles empty input', () => {
      const result = sanitizeAuthInput('')
      expect(result).toBe('')
    })

    it('handles normal input unchanged', () => {
      const input = 'normal.email@example.com'
      const result = sanitizeAuthInput(input)
      expect(result).toBe(input)
    })
  })

  describe('validateEmail', () => {
    it('validates correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
        'user space@example.com'
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })

    it('rejects emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(validateEmail(longEmail)).toBe(false)
    })

    it('handles empty input', () => {
      expect(validateEmail('')).toBe(false)
    })
  })
})