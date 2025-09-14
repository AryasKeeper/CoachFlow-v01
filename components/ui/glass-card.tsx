import { cn } from "@/lib/utils"
import { forwardRef } from "react"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark"
  blur?: "sm" | "md" | "lg"
  noPadding?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "light", blur = "md", noPadding = false, ...props }, ref) => {
    const blurValues = {
      sm: "8px",
      md: "16px",
      lg: "24px"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-200",
          // Always use glass class - dark mode is handled by CSS
          "glass",
          !noPadding && "p-6",
          "shadow-soft hover:shadow-soft-lg",
          className
        )}
        style={{
          "--glass-blur": blurValues[blur]
        } as React.CSSProperties}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
