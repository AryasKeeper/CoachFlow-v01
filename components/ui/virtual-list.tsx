"use client"

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => ReactNode
  containerHeight: number
  className?: string
  overscan?: number // Number of items to render outside visible area
  onScroll?: (scrollTop: number) => void
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  className,
  overscan = 3,
  onScroll
}: VirtualListProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // Calculate item positions
  const getItemHeight = useCallback((index: number) => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight
  }, [itemHeight])

  // Calculate which items are visible
  const { startIndex, endIndex, visibleItems, totalHeight } = useCallback(() => {
    let accumulatedHeight = 0
    let startIndex = 0
    let endIndex = items.length - 1

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i)
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan)
        break
      }
      accumulatedHeight += height
    }

    // Find end index
    accumulatedHeight = 0
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan)
        break
      }
      accumulatedHeight += getItemHeight(i)
    }

    // Calculate total height
    let totalHeight = 0
    for (let i = 0; i < items.length; i++) {
      totalHeight += getItemHeight(i)
    }

    // Get visible items
    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, i) => ({
      item,
      index: startIndex + i
    }))

    return { startIndex, endIndex, visibleItems, totalHeight }
  }, [items, scrollTop, containerHeight, overscan, getItemHeight])()

  // Calculate offset for visible items
  const getItemOffset = useCallback((index: number) => {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }, [getItemHeight])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    setIsScrolling(true)

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Set scrolling to false after scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)

    onScroll?.(newScrollTop)
  }, [onScroll])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "overflow-auto relative",
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container to maintain scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Rendered items */}
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: getItemOffset(index),
              left: 0,
              right: 0,
              height: getItemHeight(index)
            }}
            className={cn(
              "transition-opacity duration-200",
              isScrolling && "pointer-events-none"
            )}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Optimized version for fixed height items
export function FixedVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  className,
  overscan = 3,
  onScroll
}: Omit<VirtualListProps<T>, 'itemHeight'> & { itemHeight: number }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, i) => ({
    item,
    index: startIndex + i
  }))

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  return (
    <div
      ref={scrollContainerRef}
      className={cn("overflow-auto relative", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}