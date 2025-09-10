import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Shield, Heart, FileCheck, CheckCircle } from "lucide-react"

interface BadgeItem {
  label: string
  status: "verified" | "pending" | "not-provided"
  icon?: React.ReactNode
}

interface BadgeRowProps {
  badges: BadgeItem[]
  className?: string
}

const defaultIcons = {
  "WWCC": <Shield className="w-3 h-3" />,
  "First Aid": <Heart className="w-3 h-3" />,
  "Insurance": <FileCheck className="w-3 h-3" />,
}

export function BadgeRow({ badges, className }: BadgeRowProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge, index) => {
        const icon = badge.icon || defaultIcons[badge.label as keyof typeof defaultIcons] || <CheckCircle className="w-3 h-3" />
        const variant = badge.status === "verified" ? "default" : badge.status === "pending" ? "secondary" : "outline"
        
        return (
          <Badge
            key={index}
            variant={variant}
            className={cn(
              "flex items-center gap-1.5",
              badge.status === "verified" && "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200",
              badge.status === "pending" && "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-200",
              badge.status === "not-provided" && "opacity-60"
            )}
          >
            {icon}
            {badge.label}
          </Badge>
        )
      })}
    </div>
  )
}
