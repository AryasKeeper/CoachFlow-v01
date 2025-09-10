import { createHealthEndpoint } from '@/lib/monitoring/health-monitor'

// Health check endpoint for monitoring and load balancers
export const GET = createHealthEndpoint()
export const dynamic = 'force-dynamic'