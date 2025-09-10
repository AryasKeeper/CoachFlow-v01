import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"

interface StepCardProps {
  number: number
  title: string
  description: string
  className?: string
}

export function StepCard({ number, title, description, className }: StepCardProps) {
  return (
    <GlassCard className={cn("relative", className)}>
      <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-soft">
        {number}
      </div>
      <div className="pt-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </GlassCard>
  )
}
