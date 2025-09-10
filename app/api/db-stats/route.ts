import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, createAuthError } from '@/lib/error-handling'
import { queryOptimizer } from '@/lib/database'
import { requireRole } from '@/lib/auth/utils'

async function dbStatsHandler(req: NextRequest) {
  // Only allow admin users to view database statistics
  await requireRole('admin')
  
  const stats = queryOptimizer.getQueryStats(30) // Last 30 minutes
  
  // Get additional database performance data
  const [tableStats, slowQueries] = await Promise.all([
    queryOptimizer.analyzeTablePerformance().catch(() => ({ data: [], error: 'Permission denied' })),
    queryOptimizer.getSlowQueries().catch(() => ({ data: [], error: 'Permission denied' }))
  ])
  
  return NextResponse.json({
    queryStats: stats,
    tablePerformance: tableStats.data || [],
    slowQueries: slowQueries.data || [],
    timestamp: new Date().toISOString()
  })
}

export async function GET(req: NextRequest) {
  return withErrorHandling(dbStatsHandler, req)
}

export const dynamic = 'force-dynamic'