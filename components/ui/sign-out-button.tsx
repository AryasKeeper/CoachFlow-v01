"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SignOutButtonProps {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Force a hard refresh to clear all client-side state
    window.location.href = '/'
  }
  
  return (
    <Button 
      onClick={handleSignOut}
      variant="ghost" 
      className={className}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </Button>
  )
}