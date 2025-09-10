import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  align?: "left" | "center" | "right"
}

export function SectionHeader({ 
  title, 
  subtitle, 
  className,
  align = "center" 
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  }
  
  return (
    <div className={cn(
      "space-y-2 mb-8",
      alignmentClasses[align],
      className
    )}>
      <h2 className="text-h2 text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  )
}
