"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, X } from "lucide-react"

export interface TimeInterval {
  startTime: string  // "09:30"
  endTime: string    // "10:30"
  id: string
}

interface TimeIntervalPickerProps {
  value: TimeInterval[]
  onChange: (intervals: TimeInterval[]) => void
  label?: string
  required?: boolean
  error?: string
}

export function TimeIntervalPicker({
  value = [],
  onChange,
  label = "Time Intervals",
  required = false,
  error
}: TimeIntervalPickerProps) {
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const formatTimeDisplay = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(':')
    const hour24 = parseInt(hours)
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    return `${hour12}:${minutes} ${ampm}`
  }

  const validateInterval = () => {
    if (!startTime || !endTime) return "Both start and end times are required"
    
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    if (start >= end) return "End time must be after start time"
    
    // Check for overlapping intervals
    const hasOverlap = value.some(interval => {
      const existingStart = new Date(`2000-01-01T${interval.startTime}:00`)
      const existingEnd = new Date(`2000-01-01T${interval.endTime}:00`)
      
      return (
        (start < existingEnd && end > existingStart) // Check if intervals overlap
      )
    })
    
    if (hasOverlap) return "This interval overlaps with an existing one"
    
    return null
  }

  const addInterval = () => {
    const validationError = validateInterval()
    if (validationError) {
      // You could show this error in a toast or state
      console.warn(validationError)
      return
    }

    const newInterval: TimeInterval = {
      id: `${startTime}-${endTime}-${Date.now()}`,
      startTime,
      endTime
    }

    onChange([...value, newInterval])
    setStartTime("")
    setEndTime("")
  }

  const removeInterval = (id: string) => {
    onChange(value.filter(interval => interval.id !== id))
  }

  const isAddDisabled = !startTime || !endTime || !!validateInterval()

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      
      {/* Add New Interval */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label htmlFor="start-time" className="text-xs text-muted-foreground">
            Start Time
          </Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            step="300" // 5-minute increments
          />
        </div>
        
        <div className="flex-1">
          <Label htmlFor="end-time" className="text-xs text-muted-foreground">
            End Time
          </Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            step="300" // 5-minute increments
          />
        </div>
        
        <Button
          type="button"
          onClick={addInterval}
          disabled={isAddDisabled}
          size="sm"
          className="h-10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Validation Error Display */}
      {startTime && endTime && validateInterval() && (
        <p className="text-xs text-destructive">
          {validateInterval()}
        </p>
      )}
      
      {/* Display Added Intervals */}
      <div className="flex flex-wrap gap-2">
        {value.map((interval) => (
          <Badge
            key={interval.id}
            variant="secondary"
            className="flex items-center gap-2 px-3 py-1"
          >
            <Clock className="w-3 h-3" />
            <span className="text-sm">
              {formatTimeDisplay(interval.startTime)} - {formatTimeDisplay(interval.endTime)}
            </span>
            <button
              type="button"
              onClick={() => removeInterval(interval.id)}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      {/* Help Text */}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add specific time intervals when coaching is needed (e.g., 7:30 AM - 8:30 AM)
        </p>
      )}
      
      {/* External Error Display */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}