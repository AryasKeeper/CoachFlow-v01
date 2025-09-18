"use client"

import Link, { LinkProps } from 'next/link'
import { useNavigationLoading } from './navigation-loading-provider'
import { useCallback, MouseEvent, ReactNode } from 'react'

interface OptimizedLinkProps extends Omit<LinkProps, 'onClick'> {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Optimized Link component with loading states and prefetching
 * Works with Next.js Link for proper navigation
 */
export function OptimizedLink({
  href,
  children,
  className,
  onClick,
  prefetch = true,
  ...props
}: OptimizedLinkProps) {
  const { startNavigation } = useNavigationLoading()

  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // Don't interfere with modified clicks
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return
    }

    // For external links, don't show loading
    const url = typeof href === 'string' ? href : href.pathname || ''
    if (url.startsWith('http') || url.startsWith('//')) {
      return
    }

    // Start loading indicator for internal navigation
    startNavigation()

    // Call custom onClick if provided
    if (onClick) {
      onClick(e)
    }

    // Let Next.js handle the actual navigation
  }, [href, onClick, startNavigation])

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </Link>
  )
}