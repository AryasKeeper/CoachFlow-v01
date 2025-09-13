"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface SignOutButtonProps {
  className?: string
  showIcon?: boolean
  showText?: boolean
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link"
  asChild?: boolean
}

export function SignOutButton({ 
  className, 
  showIcon = true, 
  showText = true,
  variant = "ghost",
  asChild = false
}: SignOutButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  const handleSignOut = async (e: React.MouseEvent) => {
    // Prevent any parent handlers from interfering
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent double-clicks
    if (isSigningOut) return
    
    setIsSigningOut(true)
    
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Clear any local storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Force redirect to home page with hard refresh
      window.location.replace('/')
    } catch (err) {
      console.error('Sign out failed:', err)
      // Even if there's an error, try to redirect
      window.location.replace('/')
    }
  }
  
  // If used in a dropdown, render as a div with button styling
  if (asChild) {
    return (
      <div 
        onClick={handleSignOut}
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm ${className || ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSignOut(e as any)
          }
        }}
      >
        {showIcon && <LogOut className="w-4 h-4" />}
        {showText && <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>}
      </div>
    )
  }
  
  return (
    <Button 
      onClick={handleSignOut}
      variant={variant}
      className={className}
      disabled={isSigningOut}
      type="button"
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      {showText && <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>}
    </Button>
  )
}