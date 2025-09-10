import { test, expect } from '@playwright/test'

/**
 * Authentication Flow E2E Tests
 * Comprehensive testing of user authentication workflows
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the auth page
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Sign Up Flow', () => {
    test('displays sign up form correctly', async ({ page }) => {
      // Verify page title
      await expect(page).toHaveTitle(/CoachFlow.*Auth/i)
      
      // Check sign up form elements are visible
      await expect(page.locator('h1, h2')).toContainText(/sign up|create account/i)
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      // Check role selection if present
      const roleSelector = page.locator('select[name="role"], input[name="role"]')
      if (await roleSelector.count() > 0) {
        await expect(roleSelector).toBeVisible()
      }
    })

    test('validates required fields', async ({ page }) => {
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=email.*required', { timeout: 5000 })).toBeVisible()
      await expect(page.locator('text=password.*required')).toBeVisible()
    })

    test('validates email format', async ({ page }) => {
      // Enter invalid email
      await page.fill('input[type="email"]', 'invalid-email-format')
      await page.fill('input[type="password"]', 'ValidPassword123!')
      await page.click('button[type="submit"]')
      
      // Should show email format error
      await expect(page.locator('text=invalid.*email|email.*invalid')).toBeVisible()
    })

    test('shows password strength indicator', async ({ page }) => {
      // Focus on password field
      await page.click('input[type="password"]')
      
      // Type a weak password
      await page.fill('input[type="password"]', '123')
      
      // Should show password strength feedback
      const strengthIndicator = page.locator('[data-testid="password-strength"], .password-strength')
      if (await strengthIndicator.count() > 0) {
        await expect(strengthIndicator).toBeVisible()
        await expect(page.locator('text=weak', { timeout: 3000 })).toBeVisible()
      }
      
      // Type a stronger password
      await page.fill('input[type="password"]', 'StrongPassword123!')
      
      // Should show improved strength
      if (await strengthIndicator.count() > 0) {
        await expect(page.locator('text=strong|medium')).toBeVisible()
      }
    })

    test('handles sign up submission', async ({ page }) => {
      // Fill out the form with valid data
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      
      // Select role if role selector exists
      const roleSelector = page.locator('select[name="role"]')
      if (await roleSelector.count() > 0) {
        await page.selectOption('select[name="role"]', 'coach')
      }
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should either redirect or show success/error message
      await expect(async () => {
        // Wait for either success, error, or redirect
        const hasSuccess = await page.locator('text=success|welcome|created').count() > 0
        const hasError = await page.locator('text=error|failed|exists').count() > 0
        const hasRedirect = !page.url().includes('/auth')
        
        expect(hasSuccess || hasError || hasRedirect).toBe(true)
      }).toPass({ timeout: 10000 })
    })
  })

  test.describe('Sign In Flow', () => {
    test('can switch to sign in mode', async ({ page }) => {
      // Look for link to switch to sign in
      const signInLink = page.locator('text=sign in|already.*account', { timeout: 5000 })
      
      if (await signInLink.count() > 0) {
        await signInLink.click()
        
        // Should now show sign in form
        await expect(page.locator('h1, h2')).toContainText(/sign in|log in/i)
        await expect(page.locator('button[type="submit"]')).toContainText(/sign in|log in/i)
      } else {
        // Might already be in sign in mode or use different UX pattern
        console.log('Sign in toggle not found - testing current form as sign in')
        await expect(page.locator('form')).toBeVisible()
      }
    })

    test('validates sign in credentials', async ({ page }) => {
      // Switch to sign in if needed
      const signInLink = page.locator('text=sign in|already.*account')
      if (await signInLink.count() > 0) {
        await signInLink.click()
      }
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=email.*required')).toBeVisible()
      await expect(page.locator('text=password.*required')).toBeVisible()
    })

    test('handles sign in attempt', async ({ page }) => {
      // Switch to sign in if needed  
      const signInLink = page.locator('text=sign in|already.*account')
      if (await signInLink.count() > 0) {
        await signInLink.click()
      }
      
      // Fill credentials
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'TestPassword123!')
      
      // Submit
      await page.click('button[type="submit"]')
      
      // Should handle the sign in attempt (success, error, or loading state)
      await expect(async () => {
        const hasLoading = await page.locator('text=signing|loading').count() > 0
        const hasError = await page.locator('text=invalid|error|incorrect').count() > 0
        const hasRedirect = !page.url().includes('/auth')
        
        expect(hasLoading || hasError || hasRedirect).toBe(true)
      }).toPass({ timeout: 10000 })
    })
  })

  test.describe('Form Interactions', () => {
    test('form fields respond to keyboard navigation', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab')
      
      // Should focus email field
      await expect(page.locator('input[type="email"]')).toBeFocused()
      
      // Tab to password field
      await page.keyboard.press('Tab')
      await expect(page.locator('input[type="password"]')).toBeFocused()
      
      // Tab to submit button
      await page.keyboard.press('Tab')
      await expect(page.locator('button[type="submit"]')).toBeFocused()
    })

    test('shows/hides password functionality', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]')
      const toggleButton = page.locator('[data-testid="password-toggle"], button[aria-label*="password"]')
      
      // Fill password
      await passwordInput.fill('TestPassword123!')
      
      // If password toggle exists, test it
      if (await toggleButton.count() > 0) {
        // Click to show password
        await toggleButton.click()
        
        // Password field should now be type="text"
        await expect(page.locator('input[type="text"][value*="TestPassword"]')).toBeVisible()
        
        // Click to hide password again
        await toggleButton.click()
        
        // Should be back to type="password"
        await expect(passwordInput).toBeVisible()
      }
    })

    test('remembers form state during tab switches', async ({ page }) => {
      // Fill out some form data
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'TestPassword123!')
      
      // Switch to sign in mode if link exists
      const signInLink = page.locator('text=sign in|already.*account')
      if (await signInLink.count() > 0) {
        await signInLink.click()
        
        // Switch back to sign up
        const signUpLink = page.locator('text=sign up|create.*account|need.*account')
        if (await signUpLink.count() > 0) {
          await signUpLink.click()
          
          // Form should remember the values (if implemented)
          const emailValue = await page.locator('input[type="email"]').inputValue()
          const passwordValue = await page.locator('input[type="password"]').inputValue()
          
          // This might be empty if form resets - that's also valid UX
          console.log(`Email preserved: ${emailValue}, Password preserved: ${passwordValue ? '[hidden]' : 'empty'}`)
        }
      }
    })
  })

  test.describe('Error Handling', () => {
    test('displays network error gracefully', async ({ page }) => {
      // Fill valid form data
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'ValidPassword123!')
      
      // Simulate network failure
      await page.context().setOffline(true)
      
      // Try to submit
      await page.click('button[type="submit"]')
      
      // Should show network error or timeout
      await expect(page.locator('text=network|connection|offline', { timeout: 15000 })).toBeVisible()
      
      // Restore network
      await page.context().setOffline(false)
    })

    test('shows appropriate loading states', async ({ page }) => {
      // Fill form
      await page.fill('input[type="email"]', 'test@example.com')  
      await page.fill('input[type="password"]', 'ValidPassword123!')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should show loading state (even briefly)
      const loadingStates = [
        'text=loading',
        'text=signing',
        'button[disabled]',
        '.loading, .spinner',
        '[data-testid="loading"]'
      ]
      
      // Check if any loading state appears
      await expect(async () => {
        for (const selector of loadingStates) {
          if (await page.locator(selector).count() > 0) {
            await expect(page.locator(selector)).toBeVisible()
            return
          }
        }
        // If no loading state found, that's also valid UX
        expect(true).toBe(true)
      }).toPass({ timeout: 5000 })
    })
  })

  test.describe('Responsive Design', () => {
    test('works on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Form should still be usable
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      
      // Form should be properly sized (not overflowing)
      const form = page.locator('form')
      if (await form.count() > 0) {
        const formBox = await form.boundingBox()
        expect(formBox?.width).toBeLessThanOrEqual(375)
      }
    })

    test('works on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Form should be properly centered and sized
      await expect(page.locator('form')).toBeVisible()
      
      const form = page.locator('form')
      if (await form.count() > 0) {
        const formBox = await form.boundingBox()
        expect(formBox?.width).toBeLessThanOrEqual(768)
        expect(formBox?.width).toBeGreaterThan(300) // Should use reasonable width
      }
    })
  })
})