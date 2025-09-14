import dynamic from 'next/dynamic'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton-shimmer'

// Lazy load heavy components with loading states
export const LazyAnimatedListingCard = dynamic(
  () => import('@/components/ui/animated-listing-card').then(mod => ({ default: mod.AnimatedListingCard })),
  {
    loading: () => <SkeletonCard />,
    ssr: true
  }
)

export const LazyProgressRing = dynamic(
  () => import('@/components/ui/progress-ring').then(mod => ({ default: mod.ProgressRing })),
  {
    loading: () => <Skeleton className="w-32 h-32 rounded-full" shimmer />,
    ssr: false
  }
)

export const LazyMiniProgressRing = dynamic(
  () => import('@/components/ui/progress-ring').then(mod => ({ default: mod.MiniProgressRing })),
  {
    loading: () => <Skeleton className="w-10 h-10 rounded-full" shimmer />,
    ssr: false
  }
)

// Lazy load chart components (if we add them later)
export const LazyChart = dynamic(
  () => import('react-chartjs-2').then(mod => ({ default: mod.Line })),
  {
    loading: () => <Skeleton className="w-full h-64" shimmer />,
    ssr: false
  }
)

// Lazy load Framer Motion components for non-critical animations
export const LazyMotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  {
    ssr: false
  }
)