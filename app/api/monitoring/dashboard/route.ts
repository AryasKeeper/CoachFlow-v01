import { NextRequest, NextResponse } from 'next/server'
import { 
  withErrorHandling,
  createAuthError,
  createValidationError 
} from '@/lib/error-handling'
import { healthMonitor } from '@/lib/monitoring/health-monitor'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { errorTracker } from '@/lib/monitoring/error-tracking'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface MonitoringDashboard {
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    uptime: number
    checks: Array<{
      name: string
      status: 'healthy' | 'degraded' | 'unhealthy'
      responseTime?: number
      message: string
    }>
    timestamp: string
  }
  performance: {
    averageResponseTime: number
    errorRate: number
    throughput: number
    slowQueries: number
    memoryUsage: number
  }
  errors: {
    totalErrors: number
    criticalErrors: number
    errorsByType: Record<string, number>
    recentErrors: Array<{
      message: string
      severity: string
      count: number
      lastOccurred: string
    }>
  }
  database: {
    connectionCount: number
    slowQueries: number
    errorRate: number
    averageQueryTime: number
  }
  alerts: Array<{
    id: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: string
    acknowledged: boolean
  }>
  metrics: {
    activeUsers: number
    requestsPerMinute: number
    cacheHitRate: number
    deploymentVersion: string
  }
}

async function dashboardHandler(req: NextRequest) {
  // 1. Authentication check - only admins can access monitoring dashboard
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw createAuthError('Authentication required for monitoring dashboard')
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    throw createAuthError('Admin access required for monitoring dashboard')
  }

  // 2. Get timeframe parameter
  const url = new URL(req.url)
  const timeframe = url.searchParams.get('timeframe') || '1h'
  
  if (!['1h', '24h', '7d'].includes(timeframe)) {
    throw createValidationError('Invalid timeframe. Use 1h, 24h, or 7d', 'timeframe')
  }

  try {
    // 3. Collect monitoring data
    const [
      systemHealth,
      performanceMetrics,
      errorAnalytics,
      databaseMetrics
    ] = await Promise.all([
      getSystemHealth(),
      getPerformanceMetrics(timeframe),
      getErrorAnalytics(timeframe),
      getDatabaseMetrics(timeframe, supabase)
    ])

    // 4. Build dashboard response
    const dashboard: MonitoringDashboard = {
      systemHealth,
      performance: performanceMetrics,
      errors: errorAnalytics,
      database: databaseMetrics,
      alerts: await getActiveAlerts(supabase),
      metrics: await getSystemMetrics(timeframe)
    }

    return NextResponse.json(dashboard, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Monitoring-Timestamp': new Date().toISOString()
      }
    })

  } catch (error) {
    errorTracker.trackError(
      error as Error,
      { 
        route: '/api/monitoring/dashboard',
        userId: user.id,
        additionalData: { timeframe }
      },
      'high'
    )
    throw error
  }
}

async function getSystemHealth() {
  const health = healthMonitor.getHealth()
  
  return {
    overall: health.overall,
    uptime: health.uptime,
    checks: health.checks.map(check => ({
      name: check.name,
      status: check.status,
      responseTime: check.responseTime,
      message: check.message
    })),
    timestamp: health.timestamp.toISOString()
  }
}

async function getPerformanceMetrics(timeframe: string) {
  const summary = performanceMonitor.getPerformanceSummary(getTimeframeMinutes(timeframe))
  
  // Get memory usage from health check
  const systemHealth = healthMonitor.getHealth()
  const memoryCheck = systemHealth.checks.find(c => c.name === 'memory')
  const memoryUsage = memoryCheck?.metadata?.heapUsed || 0

  return {
    averageResponseTime: summary.averageResponseTime,
    errorRate: summary.errorRate,
    throughput: Math.round(summary.totalMetrics / getTimeframeMinutes(timeframe)),
    slowQueries: summary.slowRequests,
    memoryUsage: memoryUsage as number
  }
}

async function getErrorAnalytics(timeframe: string) {
  const analytics = errorTracker.getErrorAnalytics(timeframe as '1h' | '24h' | '7d')
  
  return {
    totalErrors: analytics.totalErrors,
    criticalErrors: analytics.errorsByseverity.critical,
    errorsByType: {
      'Authentication': analytics.errorsByseverity.medium,
      'Database': analytics.errorsByseverity.high, 
      'Security': analytics.errorsByseverity.critical,
      'General': analytics.errorsByseverity.low
    },
    recentErrors: analytics.topErrors.map(error => ({
      message: error.message || 'Unknown error',
      severity: error.severity || 'medium',
      count: error.count || 1,
      lastOccurred: error.lastOccurred || new Date().toISOString()
    }))
  }
}

async function getDatabaseMetrics(timeframe: string, supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  try {
    // Get database performance metrics
    const { data: dbStats, error } = await supabase
      .from('pg_stat_database')
      .select('numbackends, xact_commit, xact_rollback')
      .eq('datname', 'postgres')
      .single()

    if (error) {
      console.warn('Could not fetch database stats:', error)
      return {
        connectionCount: 0,
        slowQueries: 0,
        errorRate: 0,
        averageQueryTime: 0
      }
    }

    const errorRate = dbStats?.xact_rollback 
      ? (dbStats.xact_rollback / (dbStats.xact_commit + dbStats.xact_rollback)) * 100 
      : 0

    return {
      connectionCount: dbStats?.numbackends || 0,
      slowQueries: 0, // Would need custom tracking
      errorRate: Math.round(errorRate * 100) / 100,
      averageQueryTime: 0 // Would need custom tracking
    }
  } catch (error) {
    console.warn('Database metrics unavailable:', error)
    return {
      connectionCount: 0,
      slowQueries: 0,
      errorRate: 0,
      averageQueryTime: 0
    }
  }
}

async function getActiveAlerts(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  try {
    // In a real implementation, you'd store alerts in a table
    // For now, return simulated active alerts based on system health
    const health = healthMonitor.getHealth()
    const alerts = []

    // Check for unhealthy services
    const unhealthyServices = health.checks.filter(c => c.status === 'unhealthy')
    const degradedServices = health.checks.filter(c => c.status === 'degraded')

    for (const service of unhealthyServices) {
      alerts.push({
        id: `unhealthy_${service.name}_${Date.now()}`,
        severity: 'critical' as const,
        message: `Service ${service.name} is unhealthy: ${service.message}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

    for (const service of degradedServices) {
      alerts.push({
        id: `degraded_${service.name}_${Date.now()}`,
        severity: 'medium' as const,
        message: `Service ${service.name} is degraded: ${service.message}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

    return alerts

  } catch (error) {
    console.warn('Could not fetch alerts:', error)
    return []
  }
}

async function getSystemMetrics(timeframe: string) {
  // In production, these would come from analytics services
  return {
    activeUsers: 0, // Would track from sessions/auth
    requestsPerMinute: 0, // Would track from performance monitor
    cacheHitRate: 0, // Would track cache performance
    deploymentVersion: process.env.npm_package_version || 'unknown'
  }
}

function getTimeframeMinutes(timeframe: string): number {
  switch (timeframe) {
    case '1h': return 60
    case '24h': return 24 * 60
    case '7d': return 7 * 24 * 60
    default: return 60
  }
}

// Export GET handler only - monitoring dashboard is read-only
export async function GET(req: NextRequest) {
  return withErrorHandling(dashboardHandler, req)
}

// Force dynamic to ensure fresh data
export const dynamic = 'force-dynamic'