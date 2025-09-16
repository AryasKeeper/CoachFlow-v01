"use client"

import React, { useState, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "./avatar"
import { cn } from "@/lib/utils"

interface LazyAvatarProps {
  src?: string | null
  alt?: string
  fallbackText?: string
  className?: string
  priority?: boolean
}

export function LazyAvatar({
  src,
  alt = "Avatar",
  fallbackText = "?",
  className,
  priority = false
}: LazyAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority)

  useEffect(() => {
    if (!priority && !shouldLoad) {
      // Use Intersection Observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setShouldLoad(true)
              observer.disconnect()
            }
          })
        },
        {
          rootMargin: '50px' // Start loading 50px before the image comes into view
        }
      )

      const element = document.querySelector(`[data-avatar-id="${avatarId}"]`)
      if (element) {
        observer.observe(element)
      }

      return () => observer.disconnect()
    }
  }, [priority, shouldLoad])

  // Generate unique ID for this avatar instance
  const avatarId = React.useId()

  return (
    <Avatar 
      className={cn(
        "transition-opacity duration-300",
        !imageLoaded && "opacity-0",
        className
      )}
      data-avatar-id={avatarId}
    >
      {shouldLoad && src && (
        <AvatarImage 
          src={src} 
          alt={alt}
          onLoad={() => setImageLoaded(true)}
        />
      )}
      <AvatarFallback 
        className={cn(
          "transition-opacity duration-300",
          imageLoaded && "opacity-0"
        )}
      >
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  )
}