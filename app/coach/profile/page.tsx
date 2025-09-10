"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { 
  User,
  DollarSign,
  MapPin,
  Car,
  Plus,
  X,
  Save,
  AlertCircle
} from "lucide-react"

interface ProfileForm {
  bio: string
  rate_hourly?: number
  rate_flat?: number
  travel_km?: number
  abn?: string
}

const SPECIALTIES_OPTIONS = [
  "Youth Basketball",
  "Skills Development",
  "Team Training",
  "Individual Coaching",
  "Shooting Coach",
  "Defense Specialist",
  "Conditioning",
  "Game Strategy",
  "Beginner Friendly",
  "Elite Performance",
  "School Programs",
  "Holiday Camps"
]

const SYDNEY_SUBURBS = [
  "Sydney CBD", "Bondi", "Coogee", "Randwick", "Maroubra",
  "Newtown", "Marrickville", "Leichhardt", "Balmain", "Rozelle",
  "Mosman", "Neutral Bay", "Cremorne", "Chatswood", "Willoughby",
  "Manly", "Dee Why", "Brookvale", "Freshwater", "Curl Curl",
  "Parramatta", "Westmead", "Harris Park", "Granville", "Merrylands",
  "Liverpool", "Fairfield", "Cabramatta", "Bankstown", "Hurstville",
  "Sutherland", "Cronulla", "Miranda", "Caringbah", "Gymea",
  "Penrith", "St Marys", "Mount Druitt", "Blacktown", "Seven Hills",
  "Castle Hill", "Baulkham Hills", "Bella Vista", "Kellyville", "Rouse Hill",
  "Hornsby", "Wahroonga", "Turramurra", "Gordon", "Pymble",
  "Macquarie Park", "Ryde", "Eastwood", "Epping", "Carlingford"
]

export default function CoachProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [suburbs, setSuburbs] = useState<string[]>([])
  const [currentSuburb, setCurrentSuburb] = useState("")
  const [showSuburbSuggestions, setShowSuburbSuggestions] = useState(false)
  
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileForm>()
  
  useEffect(() => {
    loadProfile()
  }, [])
  
  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      
    if (profile) {
      setValue('bio', profile.bio || '')
      setValue('rate_hourly', profile.rate_hourly || undefined)
      setValue('rate_flat', profile.rate_flat || undefined)
      setValue('travel_km', profile.travel_km || undefined)
      setValue('abn', profile.abn || '')
      setSpecialties(profile.specialties || [])
      setSuburbs(profile.suburbs || [])
    }
  }
  
  const toggleSpecialty = (specialty: string) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter(s => s !== specialty))
    } else if (specialties.length < 6) {
      setSpecialties([...specialties, specialty])
    }
  }
  
  const addSuburb = (suburb: string) => {
    if (!suburbs.includes(suburb) && suburbs.length < 10) {
      setSuburbs([...suburbs, suburb])
      setCurrentSuburb("")
      setShowSuburbSuggestions(false)
    }
  }
  
  const removeSuburb = (suburb: string) => {
    setSuburbs(suburbs.filter(s => s !== suburb))
  }
  
  const filteredSuburbs = SYDNEY_SUBURBS.filter(suburb =>
    suburb.toLowerCase().includes(currentSuburb.toLowerCase()) &&
    !suburbs.includes(suburb)
  ).slice(0, 5)
  
  const onSubmit = async (data: ProfileForm) => {
    if (specialties.length === 0) {
      setError("Please select at least one specialty")
      return
    }
    
    if (suburbs.length === 0) {
      setError("Please select at least one service area")
      return
    }
    
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
      
      const profileData = {
        user_id: user.id,
        bio: data.bio,
        specialties,
        suburbs,
        rate_hourly: data.rate_hourly || null,
        rate_flat: data.rate_flat || null,
        travel_km: data.travel_km || null,
        abn: data.abn || null,
      }
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('coach_profiles')
          .update(profileData)
          .eq('user_id', user.id)
          
        if (updateError) {
          setError(updateError.message)
          return
        }
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('coach_profiles')
          .insert(profileData)
          
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
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Coach Profile</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="p-4 rounded-lg bg-green-500/10 text-green-700 border border-green-200">
            Profile updated successfully!
          </div>
        )}
        
        {/* Bio Section */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">About You</h2>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="Tell organizations about your coaching experience, philosophy, and what makes you unique..."
              {...register("bio", {
                maxLength: {
                  value: 500,
                  message: "Bio must be less than 500 characters"
                }
              })}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Max 500 characters
            </p>
          </div>
        </GlassCard>
        
        {/* Specialties */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Specialties</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select up to 6 areas of expertise
          </p>
          
          <div className="grid md:grid-cols-3 gap-3">
            {SPECIALTIES_OPTIONS.map((specialty) => (
              <label
                key={specialty}
                className={`
                  flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                  ${specialties.includes(specialty) 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'hover:bg-muted/50'
                  }
                  ${specialties.length >= 6 && !specialties.includes(specialty) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                  }
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={specialties.includes(specialty)}
                  onChange={() => toggleSpecialty(specialty)}
                  disabled={specialties.length >= 6 && !specialties.includes(specialty)}
                />
                <span className="text-sm">{specialty}</span>
              </label>
            ))}
          </div>
        </GlassCard>
        
        {/* Service Areas */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Service Areas</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add up to 10 Sydney suburbs where you can coach
          </p>
          
          <div className="relative mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Type a suburb name..."
                  className="pl-10"
                  value={currentSuburb}
                  onChange={(e) => {
                    setCurrentSuburb(e.target.value)
                    setShowSuburbSuggestions(true)
                  }}
                  onBlur={() => setTimeout(() => setShowSuburbSuggestions(false), 200)}
                  disabled={suburbs.length >= 10}
                />
                
                {showSuburbSuggestions && filteredSuburbs.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10">
                    {filteredSuburbs.map((suburb) => (
                      <button
                        key={suburb}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors"
                        onClick={() => addSuburb(suburb)}
                      >
                        {suburb}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {suburbs.map((suburb) => (
              <Badge key={suburb} variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {suburb}
                <button
                  type="button"
                  onClick={() => removeSuburb(suburb)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </GlassCard>
        
        {/* Rates & Travel */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Rates & Travel</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="rate_hourly">Hourly Rate ($/hr)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="rate_hourly"
                  type="number"
                  className="pl-10"
                  placeholder="60"
                  {...register("rate_hourly", {
                    min: { value: 0, message: "Rate must be positive" }
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate_flat">Flat Rate ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="rate_flat"
                  type="number"
                  className="pl-10"
                  placeholder="200"
                  {...register("rate_flat", {
                    min: { value: 0, message: "Rate must be positive" }
                  })}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="travel_km">Maximum Travel Distance (km)</Label>
            <div className="relative">
              <Car className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="travel_km"
                type="number"
                className="pl-10"
                placeholder="20"
                {...register("travel_km", {
                  min: { value: 0, message: "Distance must be positive" }
                })}
              />
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label htmlFor="abn">ABN (Optional)</Label>
            <Input
              id="abn"
              type="text"
              placeholder="12 345 678 901"
              {...register("abn")}
            />
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
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
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
