"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Json } from "@/types/database"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Clock,
  Save,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface TimeSlot {
  start: string
  end: string
}

interface DayAvailability {
  enabled: boolean
  slots: TimeSlot[]
}

interface Availability {
  monday: DayAvailability
  tuesday: DayAvailability
  wednesday: DayAvailability
  thursday: DayAvailability
  friday: DayAvailability
  saturday: DayAvailability
  sunday: DayAvailability
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

const DEFAULT_SLOTS: TimeSlot[] = [
  { start: '09:00', end: '12:00' },
  { start: '14:00', end: '18:00' }
]

export default function CoachAvailabilityPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [availability, setAvailability] = useState<Availability>(() => {
    const initial: Availability = {} as Availability
    DAYS.forEach(day => {
      initial[day] = {
        enabled: false,
        slots: [...DEFAULT_SLOTS]
      }
    })
    return initial
  })
  
  const supabase = createClient()
  
  useEffect(() => {
    loadAvailability()
  }, [])
  
  async function loadAvailability() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('coach_profiles')
      .select('availability')
      .eq('user_id', user.id)
      .single()
      
    if (profile?.availability) {
      setAvailability(profile.availability as unknown as Availability)
    }
  }
  
  const toggleDay = (day: keyof Availability) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }))
  }
  
  const updateSlot = (day: keyof Availability, slotIndex: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) => 
          i === slotIndex ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }
  
  const addSlot = (day: keyof Availability) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: '09:00', end: '17:00' }]
      }
    }))
  }
  
  const removeSlot = (day: keyof Availability, slotIndex: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== slotIndex)
      }
    }))
  }
  
  const applyToWeekdays = () => {
    const mondayAvailability = availability.monday
    const weekdays: (keyof Availability)[] = ['tuesday', 'wednesday', 'thursday', 'friday']
    
    const newAvailability = { ...availability }
    weekdays.forEach(day => {
      newAvailability[day] = {
        enabled: mondayAvailability.enabled,
        slots: [...mondayAvailability.slots]
      }
    })
    
    setAvailability(newAvailability)
  }
  
  const applyToAllDays = () => {
    const mondayAvailability = availability.monday
    
    const newAvailability = { ...availability }
    DAYS.forEach(day => {
      newAvailability[day] = {
        enabled: mondayAvailability.enabled,
        slots: [...mondayAvailability.slots]
      }
    })
    
    setAvailability(newAvailability)
  }
  
  const saveAvailability = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in")
        return
      }
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('coach_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('coach_profiles')
          .update({ availability: availability as unknown as Json })
          .eq('user_id', user.id)
          
        if (updateError) {
          setError(updateError.message)
          return
        }
      } else {
        // Create new profile with availability
        const { error: insertError } = await supabase
          .from('coach_profiles')
          .insert({
            user_id: user.id,
            availability: availability as unknown as Json
          })
          
        if (insertError) {
          setError(insertError.message)
          return
        }
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const enabledDaysCount = DAYS.filter(day => availability[day].enabled).length
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Availability Schedule</h1>
      
      <div className="mb-8">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">
              You&apos;re available <span className="font-semibold">{enabledDaysCount} days</span> per week
            </span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={applyToWeekdays}
              disabled={!availability.monday.enabled || availability.monday.slots.length === 0}
            >
              Apply Mon to Weekdays
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={applyToAllDays}
              disabled={!availability.monday.enabled || availability.monday.slots.length === 0}
            >
              Apply Mon to All
            </Button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 text-green-700 border border-green-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span>Availability saved successfully!</span>
        </div>
      )}
      
      <div className="space-y-4">
        {DAYS.map((day) => (
          <GlassCard key={day} className={!availability[day].enabled ? 'opacity-60' : ''}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={availability[day].enabled}
                  onCheckedChange={() => toggleDay(day)}
                />
                <Label className="text-lg font-medium capitalize cursor-pointer" onClick={() => toggleDay(day)}>
                  {day}
                </Label>
                {availability[day].enabled && availability[day].slots.length > 0 && (
                  <Badge variant="secondary">
                    {availability[day].slots.length} {availability[day].slots.length === 1 ? 'slot' : 'slots'}
                  </Badge>
                )}
              </div>
              
              {availability[day].enabled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addSlot(day)}
                  disabled={availability[day].slots.length >= 4}
                >
                  Add Slot
                </Button>
              )}
            </div>
            
            {availability[day].enabled && (
              <div className="space-y-3 pl-9">
                {availability[day].slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateSlot(day, index, 'start', e.target.value)}
                      className="px-3 py-1 rounded-md border bg-background"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(day, index, 'end', e.target.value)}
                      className="px-3 py-1 rounded-md border bg-background"
                    />
                    {availability[day].slots.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeSlot(day, index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
      
      <div className="mt-8 flex gap-4">
        <Button
          size="lg"
          onClick={saveAvailability}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Availability
            </>
          )}
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Tips for setting availability</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Be realistic about your schedule to avoid cancellations</li>
          <li>• Include buffer time between coaching sessions</li>
          <li>• Update your availability regularly as your schedule changes</li>
          <li>• Organizations prefer coaches with consistent availability</li>
        </ul>
      </div>
    </div>
  )
}
