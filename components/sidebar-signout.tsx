"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function SidebarSignOut() {
  const { signOut } = useAuth()

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 cursor-pointer hover:bg-muted/50"
      onClick={signOut}
      type="button"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </Button>
  )
}