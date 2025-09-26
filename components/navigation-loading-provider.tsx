"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface NavigationLoadingContextType {
  isNavigating: boolean
  startNavigation: () => void
  stopNavigation: () => void
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isNavigating: false,
  startNavigation: () => {},
  stopNavigation: () => {}
})

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext)
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingStartTimeRef = useRef<number>(0)

  // Clear loading state when pathname actually changes (navigation complete)
  useEffect(() => {
    // Clear any pending timeouts
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }

    // Stop navigation loading when route changes
    if (isNavigating) {
      // Add small delay to ensure smooth transition
      const timeoutId = setTimeout(() => {
        setIsNavigating(false)
      }, 200)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [pathname, searchParams, isNavigating])

  // Failsafe: Always clear loading after max 5 seconds
  useEffect(() => {
    if (isNavigating) {
      const failsafeTimeout = setTimeout(() => {
        setIsNavigating(false)
      }, 5000)

      return () => clearTimeout(failsafeTimeout)
    }
  }, [isNavigating])

  const startNavigation = useCallback(() => {
    loadingStartTimeRef.current = Date.now()
    setIsNavigating(true)
  }, [])

  const stopNavigation = useCallback(() => {
    setIsNavigating(false)
  }, [])

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, startNavigation, stopNavigation }}>
      {children}

      {/* Global loading indicator - Simple top progress bar only */}
      <AnimatePresence mode="wait">
        {isNavigating && (
          <motion.div
            key="loading-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gradient-to-r from-primary via-primary/80 to-primary"
          >
            <motion.div
              className="h-full bg-white/30"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </NavigationLoadingContext.Provider>
  )
}