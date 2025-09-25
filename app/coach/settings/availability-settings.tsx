"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  Loader2,
  Plus,
  X
} from "lucide-react"

interface AvailabilitySettingsProps {
  user: any
  profile: any
  onChanges: (hasChanges: boolean) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_SLOTS = [
  'Early Morning (6am-9am)',
  'Morning (9am-12pm)',
  'Afternoon (12pm-3pm)',
  'Late Afternoon (3pm-6pm)',
  'Evening (6pm-9pm)',
  'Night (9pm-12am)'
]

const LOCATIONS = [
  'Sydney CBD',
  'North Sydney',
  'Eastern Suburbs',
  'Western Sydney',
  'Northern Beaches',
  'Inner West',
  'South Sydney',
  'Hills District'
]

export function AvailabilitySettings({ user, profile, onChanges }: AvailabilitySettingsProps) {
  const [loading, setLoading] = useState(false)

  // Initialize from profile or defaults
  const defaultAvailability = {
    isAvailable: true,
    immediateAvailability: false,
    maxDistance: '25km',
    preferredLocations: profile?.suburbs || ['Sydney CBD', 'North Sydney'],
    availableDays: profile?.availability?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableSlots: profile?.availability?.slots || ['Morning (9am-12pm)', 'Afternoon (12pm-3pm)'],
    minimumNotice: profile?.availability?.minimum_notice || '24 hours'
  }

  const [availability, setAvailability] = useState(defaultAvailability)

  const handleChange = (key: string, value: any) => {
    setAvailability(prev => ({ ...prev, [key]: value }))
    onChanges(true)
  }

  const toggleDay = (day: string) => {
    const days = availability.availableDays.includes(day)
      ? availability.availableDays.filter((d: string) => d !== day)
      : [...availability.availableDays, day]
    handleChange('availableDays', days)
  }

  const toggleSlot = (slot: string) => {
    const slots = availability.availableSlots.includes(slot)
      ? availability.availableSlots.filter((s: string) => s !== slot)
      : [...availability.availableSlots, slot]
    handleChange('availableSlots', slots)
  }

  const toggleLocation = (location: string) => {
    const locations = availability.preferredLocations.includes(location)
      ? availability.preferredLocations.filter((l: string) => l !== location)
      : [...availability.preferredLocations, location]
    handleChange('preferredLocations', locations)
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Save availability settings to coach_profiles
      const { error } = await supabase
        .from('coach_profiles')
        .upsert({
          user_id: user.id,
          availability: {
            days: availability.availableDays,
            slots: availability.availableSlots,
            minimum_notice: availability.minimumNotice,
            immediate: availability.immediateAvailability,
            max_distance: availability.maxDistance
          },
          suburbs: availability.preferredLocations
        })

      if (error) throw error

      toast.success('Availability settings updated')
      onChanges(false)
    } catch (error) {
      console.error('Error updating availability settings:', error)
      toast.error('Failed to update availability settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Availability Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Set when and where you're available for coaching
        </p>
      </div>

      <Separator />

      {/* Availability Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="space-y-1">
            <Label htmlFor="available" className="text-base font-medium">
              Currently Available
            </Label>
            <p className="text-sm text-muted-foreground">
              Toggle your availability for new coaching opportunities
            </p>
          </div>
          <Switch
            id="available"
            checked={availability.isAvailable}
            onCheckedChange={(value) => handleChange('isAvailable', value)}
          />
        </div>

        {availability.isAvailable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="space-y-1">
              <Label htmlFor="immediate" className="text-base font-medium">
                Immediate Availability
              </Label>
              <p className="text-sm text-muted-foreground">
                Available for last-minute bookings (same day)
              </p>
            </div>
            <Switch
              id="immediate"
              checked={availability.immediateAvailability}
              onCheckedChange={(value) => handleChange('immediateAvailability', value)}
            />
          </motion.div>
        )}
      </motion.div>

      <Separator />

      {/* Days Available */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <Label>Available Days</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DAYS.map((day) => {
            const isSelected = availability.availableDays.includes(day)
            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleDay(day)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                  }
                `}
              >
                {day.slice(0, 3)}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      <Separator />

      {/* Time Slots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Label className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Preferred Time Slots
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isSelected = availability.availableSlots.includes(slot)
            return (
              <motion.button
                key={slot}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleSlot(slot)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                  ${isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                  }
                `}
              >
                {slot}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      <Separator />

      {/* Preferred Locations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Preferred Locations
        </Label>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((location) => {
            const isSelected = availability.preferredLocations.includes(location)
            return (
              <Badge
                key={location}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => toggleLocation(location)}
              >
                {location}
                {isSelected && <X className="w-3 h-3 ml-1" />}
              </Badge>
            )
          })}
        </div>
      </motion.div>

      <Separator />

      {/* Additional Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <Label>Additional Settings</Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Maximum Travel Distance</p>
              <p className="text-xs text-muted-foreground">How far you're willing to travel</p>
            </div>
            <select
              value={availability.maxDistance}
              onChange={(e) => handleChange('maxDistance', e.target.value)}
              className="px-3 py-1 rounded-md bg-muted text-sm"
            >
              <option value="10km">10km</option>
              <option value="25km">25km</option>
              <option value="50km">50km</option>
              <option value="100km">100km</option>
              <option value="Any">Any distance</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Minimum Notice Required</p>
              <p className="text-xs text-muted-foreground">How much advance notice you need</p>
            </div>
            <select
              value={availability.minimumNotice}
              onChange={(e) => handleChange('minimumNotice', e.target.value)}
              className="px-3 py-1 rounded-md bg-muted text-sm"
            >
              <option value="None">No notice required</option>
              <option value="2 hours">2 hours</option>
              <option value="12 hours">12 hours</option>
              <option value="24 hours">24 hours</option>
              <option value="48 hours">48 hours</option>
              <option value="1 week">1 week</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end pt-4"
      >
        <Button
          onClick={handleSave}
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Availability
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}