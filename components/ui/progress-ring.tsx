"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  labelClassName?: string
  color?: "primary" | "success" | "warning" | "danger"
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  labelClassName,
  color = "primary"
}: ProgressRingProps) {
  const normalizedRadius = (size - strokeWidth * 2) / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const colorClasses = {
    primary: "text-primary",
    success: "text-green-500",
    warning: "text-orange-500",
    danger: "text-red-500"
  }

  const getProgressColor = () => {
    if (color !== "primary") return colorClasses[color]
    if (progress >= 75) return "text-green-500"
    if (progress >= 50) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset: 0 }}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1], // Apple's easing
            delay: 0.2
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className={getProgressColor()}
        />
      </svg>
      {showLabel && (
        <motion.div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            labelClassName
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.8,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

interface MiniProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function MiniProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  className
}: MiniProgressRingProps) {
  const normalizedRadius = (size - strokeWidth * 2) / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
      >
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset: 0 }}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="text-muted/20"
        />
        <motion.circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1]
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className={progress >= 75 ? "text-green-500" : progress >= 50 ? "text-orange-500" : "text-red-500"}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}