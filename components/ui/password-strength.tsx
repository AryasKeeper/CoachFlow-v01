"use client"

import { useMemo } from "react"
import { validatePassword } from "@/lib/auth/middleware"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
  const validation = useMemo(() => {
    if (!password) return null
    return validatePassword(password)
  }, [password])

  if (!validation) return null

  const strengthColors = {
    weak: "text-red-500",
    medium: "text-yellow-500", 
    strong: "text-green-500"
  }

  const strengthValues = {
    weak: 25,
    medium: 65,
    strong: 100
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password strength</span>
        <span className={`text-sm font-medium ${strengthColors[validation.strength]}`}>
          {validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}
        </span>
      </div>
      
      {/* Progress bar */}
      <Progress 
        value={strengthValues[validation.strength]} 
        className="h-2"
      />
      
      {/* Requirements checklist */}
      <div className="space-y-1">
        {validation.errors.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>All requirements met</span>
          </div>
        ) : (
          validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ))
        )}
        
        {/* Additional tips */}
        {validation.strength === 'weak' && validation.errors.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <AlertCircle className="w-4 h-4" />
            <span>Try making your password longer or more complex</span>
          </div>
        )}
      </div>
    </div>
  )
}