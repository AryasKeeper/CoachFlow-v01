"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon, Users, Calendar, ClipboardList } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon | string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  // Smart icon selection based on context
  let IconComponent: LucideIcon = Users
  
  if (typeof icon === 'function') {
    IconComponent = icon
  } else if (!icon) {
    // Auto-select icon based on title content when no icon is provided
    if (title.toLowerCase().includes('booking')) {
      IconComponent = Calendar
    } else if (title.toLowerCase().includes('listing') || title.toLowerCase().includes('opportunit')) {
      IconComponent = ClipboardList
    } else {
      IconComponent = Users
    }
  }
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
