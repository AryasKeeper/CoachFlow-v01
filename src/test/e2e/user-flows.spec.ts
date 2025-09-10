import { test, expect } from '@playwright/test'

/**
 * End-to-End Tests for Core User Flows
 * Tests complete user journeys from UI interaction to backend integration
 */

test.describe('CoachFlow User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test.describe('Landing Page Flow', () => {
    test('displays main landing page correctly', async ({ page }) => {
      // Check page title and main heading
      await expect(page).toHaveTitle(/CoachFlow/i)
      
      // Verify key sections are present
      await expect(page.locator('h1')).toContainText(/find.*coach/i)
      
      // Check navigation elements
      await expect(page.locator('nav')).toBeVisible()
      
      // Verify main call-to-action buttons are present
      const getStartedButton = page.getByRole('link', { name: /get started/i })
      const learnMoreButton = page.getByRole('link', { name: /learn more/i })
      
      await expect(getStartedButton).toBeVisible()
      await expect(learnMoreButton).toBeVisible()
    })

    test('navigation links work correctly', async ({ page }) => {
      // Test "How it Works" navigation
      await page.click('text=How it Works')
      await expect(page).toHaveURL(/.*how-it-works/)
      await expect(page.locator('h1')).toContainText(/how.*works/i)
      
      // Go back to home
      await page.goto('/')
      
      // Test "Pricing" navigation  
      await page.click('text=Pricing')
      await expect(page).toHaveURL(/.*pricing/)
      await expect(page.locator('h1')).toContainText(/pricing/i)
    })

    test('responsive design works on different screen sizes', async ({ page }) => {
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Check that mobile menu button appears
      const mobileMenuButton = page.locator('[aria-label="Menu"]')
      await expect(mobileMenuButton).toBeVisible()
      
      // Open mobile menu
      await mobileMenuButton.click()
      
      // Verify navigation items are visible in mobile menu
      await expect(page.locator('text=How it Works')).toBeVisible()
      await expect(page.locator('text=Pricing')).toBeVisible()
      
      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Test desktop view
      await page.setViewportSize({ width: 1280, height: 1024 })
      
      // Verify desktop navigation is visible
      await expect(page.locator('nav a[href*="how-it-works"]')).toBeVisible()
      await expect(page.locator('nav a[href*="pricing"]')).toBeVisible()
    })
  })

  test.describe('Authentication Flow', () => {
    test('user can navigate to sign up page', async ({ page }) => {
      // Click sign up button
      await page.click('text=Sign Up')
      
      // Should navigate to auth page
      await expect(page).toHaveURL(/.*auth/)
      
      // Verify sign up form is visible
      await expect(page.locator('form')).toBeVisible()
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('user can switch between sign up and sign in modes', async ({ page }) => {
      await page.goto('/auth')
      
      // Should start in sign up mode
      await expect(page.locator('text=Create Account')).toBeVisible()
      
      // Switch to sign in
      await page.click('text=Already have an account?')
      await expect(page.locator('text=Sign In')).toBeVisible()
      
      // Switch back to sign up
      await page.click('text=Need an account?')
      await expect(page.locator('text=Create Account')).toBeVisible()
    })

    test('displays validation errors for invalid input', async ({ page }) => {
      await page.goto('/auth')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible()
      await expect(page.locator('text=Password is required')).toBeVisible()
      
      // Test invalid email format
      await page.fill('input[type="email"]', 'invalid-email')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Invalid email format')).toBeVisible()
      
      // Test weak password
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', '123')
      await page.click('button[type="submit"]')
      
      // Should show password strength indicator
      await expect(page.locator('[data-testid="password-strength"]')).toBeVisible()
      await expect(page.locator('text=Weak')).toBeVisible()
    })
  })

  test.describe('Coach Discovery Flow', () => {
    test('user can search for coaches', async ({ page }) => {
      // Navigate to coach search (assuming there's a search page)
      await page.goto('/coaches')
      
      // Verify search filters are present
      await expect(page.locator('input[placeholder*="location"]')).toBeVisible()
      await expect(page.locator('select[name="specialty"]')).toBeVisible()
      
      // Perform a search
      await page.fill('input[placeholder*="location"]', 'Sydney')
      await page.selectOption('select[name="specialty"]', 'Basketball')
      await page.click('button[type="submit"]')
      
      // Verify search results are displayed
      await expect(page.locator('[data-testid="coach-results"]')).toBeVisible()
    })

    test('user can view coach profile details', async ({ page }) => {
      await page.goto('/coaches')
      
      // Wait for coach cards to load
      await page.waitForSelector('[data-testid="coach-card"]')
      
      // Click on first coach
      await page.click('[data-testid="coach-card"]:first-child')
      
      // Should navigate to coach profile
      await expect(page).toHaveURL(/.*coach\/[^/]+/)
      
      // Verify coach profile elements
      await expect(page.locator('[data-testid="coach-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="coach-bio"]')).toBeVisible()
      await expect(page.locator('[data-testid="coach-specialties"]')).toBeVisible()
      await expect(page.locator('[data-testid="coach-hourly-rate"]')).toBeVisible()
    })
  })

  test.describe('Job Listing Flow', () => {
    test.skip('authenticated user can create a job listing', async ({ page }) => {
      // Skip for now - requires authentication setup
      // This test would verify:
      // 1. User can access create listing page when authenticated
      // 2. Form validation works correctly
      // 3. Successfully created listing appears in listings
      // 4. User receives confirmation
    })

    test('user can browse job listings', async ({ page }) => {
      await page.goto('/listings')
      
      // Verify listings page loads
      await expect(page.locator('h1')).toContainText(/job.*listing/i)
      
      // Check for listing cards or empty state
      const listingExists = await page.locator('[data-testid="listing-card"]').count()
      
      if (listingExists > 0) {
        // Verify listing card elements
        await expect(page.locator('[data-testid="listing-title"]').first()).toBeVisible()
        await expect(page.locator('[data-testid="listing-location"]').first()).toBeVisible()
        await expect(page.locator('[data-testid="listing-pay-rate"]').first()).toBeVisible()
      } else {
        // Verify empty state message
        await expect(page.locator('text=No listings available')).toBeVisible()
      }
    })
  })

  test.describe('Error Handling Flow', () => {
    test('displays appropriate error page for 404', async ({ page }) => {
      // Navigate to non-existent page
      await page.goto('/non-existent-page')
      
      // Should show 404 error
      await expect(page.locator('text=404')).toBeVisible()
      await expect(page.locator('text=Page not found')).toBeVisible()
      
      // Should have link back to home
      const homeLink = page.getByRole('link', { name: /go home/i })
      await expect(homeLink).toBeVisible()
      
      // Test home link works
      await homeLink.click()
      await expect(page).toHaveURL('/')
    })

    test('handles network errors gracefully', async ({ page }) => {
      // Simulate network error by going offline
      await page.context().setOffline(true)
      
      // Try to navigate to a page that requires data
      await page.goto('/coaches')
      
      // Should show appropriate error message or retry option
      // This depends on how the app handles offline states
      await expect(page.locator('text=connection', { timeout: 10000 })).toBeVisible()
      
      // Restore connection
      await page.context().setOffline(false)
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('page loads within performance budget', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('meets basic accessibility requirements', async ({ page }) => {
      await page.goto('/')
      
      // Check for proper heading structure
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThan(0)
      
      // Verify images have alt text
      const images = page.locator('img')
      const imageCount = await images.count()
      
      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt')
        expect(alt).toBeTruthy() // Should have alt text
      }
      
      // Check for proper form labels
      const inputs = page.locator('input[type="email"], input[type="password"]')
      const inputCount = await inputs.count()
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const id = await input.getAttribute('id')
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`)
          await expect(label).toBeVisible()
        }
      }
    })
  })
})