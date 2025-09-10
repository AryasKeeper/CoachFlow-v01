import { chromium, FullConfig } from '@playwright/test'

/**
 * Global setup for Playwright E2E tests
 * Runs once before all test files
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test global setup...')
  
  const { baseURL } = config.projects[0].use
  
  if (!baseURL) {
    throw new Error('Base URL not configured for tests')
  }

  // Launch browser and create a new page
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    console.log(`📡 Checking if application is available at ${baseURL}`)
    
    // Wait for the application to be ready
    await page.goto(baseURL, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })
    
    // Verify the app loads properly
    const title = await page.title()
    if (!title) {
      throw new Error('Application failed to load - no page title detected')
    }
    
    console.log(`✅ Application is ready! Page title: "${title}"`)
    
    // Optional: Pre-populate test data or perform authentication
    // This would be where you'd set up test users, seed data, etc.
    
    console.log('🎯 E2E test environment is ready')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup