"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertCircle, Plus, X, ArrowLeft, Save, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/date-utils"
import { SuburbSelector } from "@/components/ui/suburb-selector"
import Link from "next/link"

interface ListingForm {
  title: string
  description: string
  pay_min: number
  pay_max: number
  urgency: "low" | "medium" | "urgent"
}

interface TimeInterval {
  id: string
  startTime: string
  endTime: string
}

interface EditListingFormProps {
  listing: any
}

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<ListingForm>({
    defaultValues: {
      title: listing.title,
      description: listing.description || "",
      pay_min: listing.pay_min,
      pay_max: listing.pay_max,
      urgency: listing.urgency
    }
  })
  
  // Parse existing data
  const [dates, setDates] = useState<string[]>(listing.dates || [])
  const [currentDate, setCurrentDate] = useState("")
  const [timeIntervals, setTimeIntervals] = useState<TimeInterval[]>(
    listing.time_intervals || []
  )
  const [suburbs, setSuburbs] = useState<string[]>(listing.suburbs || [])
  const [requiredBadges, setRequiredBadges] = useState<string[]>(
    listing.required_badges || []
  )
  const [genderPreference, setGenderPreference] = useState(
    listing.gender_preference || "no-preference"
  )
  
  const [currentTimeStart, setCurrentTimeStart] = useState("")
  const [currentTimeEnd, setCurrentTimeEnd] = useState("")
  
  const GENDER_PREFERENCE_OPTIONS = [
    { value: "no-preference", label: "No preference (shows to all coaches)" },
    { value: "male", label: "Male coach preferred" },
    { value: "female", label: "Female coach preferred" },
    { value: "non-binary", label: "Non-binary coach preferred" }
  ]
  
  const availableBadges = [
    { value: "wwcc", label: "WWCC (Working with Children)" },
    { value: "first-aid", label: "First Aid/CPR" },
    { value: "insurance", label: "Professional Insurance" },
    { value: "level-1", label: "Basketball Australia Level 1" },
    { value: "level-2", label: "Basketball Australia Level 2" },
  ]
  
  const addDate = () => {
    if (currentDate && !dates.includes(currentDate)) {
      setDates([...dates, currentDate])
      setCurrentDate("")
    }
  }
  
  const removeDate = (date: string) => {
    setDates(dates.filter(d => d !== date))
  }
  
  const addTimeInterval = () => {
    if (currentTimeStart && currentTimeEnd) {
      const newInterval: TimeInterval = {
        id: Date.now().toString(),
        startTime: currentTimeStart,
        endTime: currentTimeEnd
      }
      setTimeIntervals([...timeIntervals, newInterval])
      setCurrentTimeStart("")
      setCurrentTimeEnd("")
    }
  }
  
  const removeTimeInterval = (id: string) => {
    setTimeIntervals(timeIntervals.filter(t => t.id !== id))
  }
  
  const toggleBadge = (badge: string) => {
    if (requiredBadges.includes(badge)) {
      setRequiredBadges(requiredBadges.filter(b => b !== badge))
    } else {
      setRequiredBadges([...requiredBadges, badge])
    }
  }
  
  const onSubmit = async (data: ListingForm) => {
    if (dates.length === 0) {
      setError("Please add at least one date")
      return
    }

    if (timeIntervals.length === 0) {
      setError("Please add at least one time interval")
      return
    }

    if (suburbs.length === 0) {
      setError("Please select at least one suburb")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Starting listing update...', { listingId: listing.id })

      const updateData = {
        title: data.title,
        description: data.description,
        location: suburbs.join(", "), // Keep for backwards compatibility
        suburbs: suburbs,
        dates,
        time_intervals: timeIntervals,
        pay_min: data.pay_min,
        pay_max: data.pay_max,
        required_badges: requiredBadges,
        urgency: data.urgency,
        gender_preference: genderPreference
      }

      console.log('Update data:', updateData)

      // Use API route to handle the update
      const response = await fetch(`/api/org/listings/${listing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()
      console.log('API response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update listing')
      }

      console.log('Listing updated successfully, redirecting...')
      router.push(`/org/listings/${listing.id}`)
      router.refresh()
    } catch (err: any) {
      console.error('Listing update error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      console.log('Starting listing delete...', { listingId: listing.id })

      // Use API route to handle the delete
      const response = await fetch(`/api/org/listings/${listing.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      console.log('Delete API response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete listing')
      }

      console.log('Listing deleted successfully, redirecting...')
      router.push('/org/listings')
      router.refresh()
    } catch (err: any) {
      console.error('Listing delete error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Basic Information */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Youth Basketball Coach for U14 Team"
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 10,
                  message: "Title must be at least 10 characters"
                }
              })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe the coaching role, expectations, skill level of players, etc."
              {...register("description")}
            />
          </div>
          
          <SuburbSelector
            value={suburbs}
            onChange={setSuburbs}
            label="Location"
            placeholder="Type suburb names..."
            maxSuburbs={3}
            required
            description="Select up to 3 suburbs where coaching is needed"
          />
          
          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select 
              value={listing.urgency} 
              onValueChange={(value: "low" | "medium" | "urgent") => 
                register("urgency").onChange({ target: { value } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Flexible timing</SelectItem>
                <SelectItem value="medium">Medium - Within 2 weeks</SelectItem>
                <SelectItem value="urgent">Urgent - ASAP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>
      
      {/* Schedule */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Schedule</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dates Required *</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <Button
                type="button"
                onClick={addDate}
                disabled={!currentDate}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Date
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {dates.map((date) => (
                <Badge key={date} variant="secondary" className="pr-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(date + 'T00:00:00', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 px-1"
                    onClick={() => removeDate(date)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Time Intervals *</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={currentTimeStart}
                onChange={(e) => setCurrentTimeStart(e.target.value)}
                placeholder="Start time"
              />
              <Input
                type="time"
                value={currentTimeEnd}
                onChange={(e) => setCurrentTimeEnd(e.target.value)}
                placeholder="End time"
              />
              <Button
                type="button"
                onClick={addTimeInterval}
                disabled={!currentTimeStart || !currentTimeEnd}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Time
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {timeIntervals.map((interval) => (
                <Badge key={interval.id} variant="secondary" className="pr-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {interval.startTime} - {interval.endTime}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 px-1"
                    onClick={() => removeTimeInterval(interval.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
      
      {/* Compensation */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Compensation</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pay_min">Minimum Rate ($/hr) *</Label>
            <Input
              id="pay_min"
              type="number"
              min="30"
              max="500"
              {...register("pay_min", {
                required: "Minimum rate is required",
                min: { value: 30, message: "Minimum rate must be at least $30/hr" },
                max: { value: 500, message: "Maximum rate cannot exceed $500/hr" }
              })}
            />
            {errors.pay_min && (
              <p className="text-sm text-destructive">{errors.pay_min.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pay_max">Maximum Rate ($/hr) *</Label>
            <Input
              id="pay_max"
              type="number"
              min="30"
              max="500"
              {...register("pay_max", {
                required: "Maximum rate is required",
                min: { value: 30, message: "Maximum rate must be at least $30/hr" },
                max: { value: 500, message: "Maximum rate cannot exceed $500/hr" }
              })}
            />
            {errors.pay_max && (
              <p className="text-sm text-destructive">{errors.pay_max.message}</p>
            )}
          </div>
        </div>
      </GlassCard>
      
      {/* Requirements */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">Requirements</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Required Certifications</Label>
            <div className="flex flex-wrap gap-2">
              {availableBadges.map((badge) => (
                <Badge
                  key={badge.value}
                  variant={requiredBadges.includes(badge.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    toggleBadge(badge.value)
                  }}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Gender Preference</Label>
            <Select 
              value={genderPreference} 
              onValueChange={setGenderPreference}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDER_PREFERENCE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>
      
      {/* Actions */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          asChild
        >
          <Link href={`/org/listings/${listing.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Link>
        </Button>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Listing"}
          </Button>
          
          <Button type="submit" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}