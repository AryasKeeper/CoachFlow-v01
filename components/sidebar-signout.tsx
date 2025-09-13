"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function SidebarSignOut() {
  const handleSignOut = async () => {
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    } catch (err) {
      console.error('Sign out error:', err)
      window.location.href = '/'
    }
  }
  
  return (
    <Button 
      variant="ghost"
      className="w-full justify-start gap-3"
      onClick={handleSignOut}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </Button>
  )
}