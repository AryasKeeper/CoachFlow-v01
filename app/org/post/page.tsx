"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TimeIntervalPicker, type TimeInterval } from "@/components/ui/time-interval-picker"
import { SuburbSelector } from "@/components/ui/suburb-selector"
import { useForm } from "react-hook-form"
import { 
  MapPin, 
  Calendar,
  Clock,
  DollarSign,
  Shield,
  AlertCircle,
  Plus,
  X
} from "lucide-react"

interface ListingForm {
  title: string
  description: string
  urgency: string
  pay_min?: number
  pay_max?: number
}

export default function PostListingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dates, setDates] = useState<string[]>([])
  const [timeIntervals, setTimeIntervals] = useState<TimeInterval[]>([])
  const [requiredBadges, setRequiredBadges] = useState<string[]>([])
  const [suburbs, setSuburbs] = useState<string[]>([])
  const [currentDate, setCurrentDate] = useState("")
  
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors } } = useForm<ListingForm>()
  
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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("You must be logged in to post a listing")
        return
      }
      
      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
          org_id: user.id,
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
          status: 'active'
        })
        .select()
        .single()
      
      if (insertError) {
        setError(insertError.message)
        return
      }
      
      router.push(`/org/listings/${listing.id}`)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Post a Coaching Need</h1>
      
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
              <Label htmlFor="urgency">Urgency</Label>
              <Select 
                defaultValue="flexible"
                onValueChange={(value) => register("urgency").onChange({ target: { value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent (Need within 48 hours)</SelectItem>
                  <SelectItem value="soon">Soon (Within a week)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
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
              <Label>Dates *</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Button type="button" onClick={addDate} disabled={!currentDate}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {dates.map((date) => (
                  <Badge key={date} variant="secondary" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(date).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => removeDate(date)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <TimeIntervalPicker
              value={timeIntervals}
              onChange={setTimeIntervals}
              label="Time Intervals"
              required
            />
          </div>
        </GlassCard>
        
        {/* Compensation */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Compensation (Optional)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Providing a pay range helps attract more qualified coaches
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay_min">Minimum Rate ($/hour)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="pay_min"
                  type="number"
                  className="pl-10"
                  placeholder="50"
                  {...register("pay_min", {
                    min: { value: 0, message: "Rate must be positive" }
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pay_max">Maximum Rate ($/hour)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="pay_max"
                  type="number"
                  className="pl-10"
                  placeholder="80"
                  {...register("pay_max", {
                    min: { value: 0, message: "Rate must be positive" }
                  })}
                />
              </div>
            </div>
          </div>
        </GlassCard>
        
        {/* Required Certifications */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Required Certifications</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select any certifications that are mandatory for this role
          </p>
          
          <div className="space-y-3">
            {availableBadges.map((badge) => (
              <label
                key={badge.value}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={requiredBadges.includes(badge.value)}
                  onChange={() => toggleBadge(badge.value)}
                  className="rounded border-border"
                />
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span>{badge.label}</span>
                </div>
              </label>
            ))}
          </div>
        </GlassCard>
        
        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Posting..." : "Post Listing"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
