import { describe, it, expect, beforeAll } from 'vitest'
import { GET } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

describe('Health API Integration Tests', () => {
  let request: NextRequest

  beforeAll(() => {
    // Create mock request
    request = new NextRequest('http://localhost:3000/api/health', {
      method: 'GET'
    })
  })

  describe('GET /api/health', () => {
    it('returns 200 status and health data', async () => {
      const response = await GET()
      
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
      
      const data = await response.json()
      
      // Health endpoint should return basic health information
      expect(data).toHaveProperty('overall')
      expect(data).toHaveProperty('timestamp')
      expect(data.overall).toBe('healthy')
    })

    it('includes system information', async () => {
      const response = await GET()
      const data = await response.json()
      
      // Should include relevant system metrics
      expect(data).toHaveProperty('uptime')
      expect(data).toHaveProperty('checks')
      expect(data).toHaveProperty('version')
      expect(data).toHaveProperty('environment')
    })

    it('returns consistent response structure', async () => {
      const response1 = await GET()
      const response2 = await GET()
      
      const data1 = await response1.json()
      const data2 = await response2.json()
      
      // Structure should be consistent
      expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort())
      
      // Status should be consistent for healthy system
      expect(data1.overall).toBe(data2.overall)
    })

    it('includes proper headers for monitoring', async () => {
      const response = await GET()
      
      // Should include cache control headers for monitoring systems
      expect(response.headers.get('cache-control')).toContain('no-cache')
    })
  })
})