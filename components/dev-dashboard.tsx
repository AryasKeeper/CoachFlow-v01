"use client"

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Gauge,
  HardDrive,
  RefreshCw,
  TrendingUp,
  Zap
} from 'lucide-react'

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: Array<{
    name: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    message: string
    responseTime?: number
    lastCheck: Date
    metadata?: Record<string, unknown>
  }>
  uptime: number
  timestamp: Date
}

interface PerformanceSummary {
  totalMetrics: number
  slowRequests: number
  averageResponseTime: number
  errorRate: number
  memoryUsage?: number
}

export function DevDashboard() {
  const [isVisible, setIsVisible] = useState(false)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [loading, setLoading] = useState(false)

  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development'

  const fetchHealthData = async () => {
    if (!isDevelopment) return

    setLoading(true)
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isVisible && isDevelopment) {
      fetchHealthData()
      const interval = setInterval(fetchHealthData, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, isDevelopment]) // fetchHealthData is stable

  // Don't render in production
  if (!isDevelopment) {
    return null
  }

  // Floating toggle button
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800"
        >
          <Activity className="w-4 h-4 mr-2" />
          Dev Dashboard
        </Button>
      </div>
    )
  }

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return 'border-green-500'
      case 'degraded':
        return 'border-yellow-500'
      case 'unhealthy':
        return 'border-red-500'
    }
  }

  const formatUptime = (uptimeMs: number) => {
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <GlassCard className={`p-4 bg-gray-900/95 text-white border-2 ${health ? getStatusColor(health.overall) : 'border-gray-600'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold">System Monitor</h3>
            {health && getStatusIcon(health.overall)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchHealthData}
              size="sm"
              variant="ghost"
              disabled={loading}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* System Overview */}
        {health && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Status:</span>
              <Badge 
                variant={health.overall === 'healthy' ? 'default' : 'destructive'}
                className="capitalize"
              >
                {health.overall}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Uptime:</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatUptime(health.uptime)}
              </span>
            </div>
          </div>
        )}

        {/* Health Checks */}
        {health && health.checks.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-300">Health Checks</h4>
            {health.checks.map((check) => (
              <div key={check.name} className="flex items-center gap-2 text-xs">
                {getStatusIcon(check.status)}
                <span className="flex-1 capitalize">{check.name.replace('_', ' ')}</span>
                {check.responseTime && (
                  <span className="text-gray-400">{check.responseTime}ms</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Performance Metrics */}
        {performance && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-300">Performance</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-400" />
                <span>Avg: {performance.averageResponseTime}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span>Errors: {performance.errorRate}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="w-3 h-3 text-yellow-400" />
                <span>Slow: {performance.slowRequests}</span>
              </div>
              {performance.memoryUsage && (
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-purple-400" />
                  <span>Mem: {performance.memoryUsage}MB</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 text-xs">
          <Button
            onClick={() => window.open('/api/health', '_blank')}
            size="sm"
            variant="outline"
            className="flex-1 h-6 text-xs"
          >
            <Database className="w-3 h-3 mr-1" />
            Health API
          </Button>
          <Button
            onClick={() => console.clear()}
            size="sm"
            variant="outline"
            className="flex-1 h-6 text-xs"
          >
            Clear Console
          </Button>
        </div>

        {/* Last Updated */}
        <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400 text-center">
          Last updated: {health ? new Date(health.timestamp).toLocaleTimeString() : 'Never'}
        </div>
      </GlassCard>
    </div>
  )
}