import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/CoachFlow/)
    await expect(page.getByText('CoachFlow')).toBeVisible()
  })

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/\/auth\/sign-in/)
  })

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/\/auth\/sign-up/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/sign-in')
    
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message (exact text may vary based on implementation)
    await expect(page.locator('[role="alert"], .error, .text-red')).toBeVisible()
  })

  test('should require authentication for protected AI chat endpoint', async ({ page }) => {
    // Test our secured API endpoint
    const response = await page.request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }]
      }
    })
    
    // Should return 401 Unauthorized due to our security fix
    expect(response.status()).toBe(401)
  })
})