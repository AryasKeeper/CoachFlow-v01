import { FullConfig } from '@playwright/test'

/**
 * Global teardown for Playwright E2E tests
 * Runs once after all test files complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test global teardown...')
  
  try {
    // Cleanup test data if needed
    // This would be where you'd clean up test users, reset database state, etc.
    
    // Log test results summary
    console.log('📊 E2E test session completed')
    console.log('🎯 Test results available in:')
    console.log('  - HTML: playwright-report/index.html')
    console.log('  - JSON: playwright-report/results.json')
    console.log('  - Screenshots/Videos: test-results/')
    
    console.log('✅ Global teardown completed successfully')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw here as it would fail the entire test suite
  }
}

export default globalTeardown