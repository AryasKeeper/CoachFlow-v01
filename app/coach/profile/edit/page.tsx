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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import {
  User,
  DollarSign,
  MapPin,
  Car,
  Plus,
  X,
  Save,
  AlertCircle,
  Phone,
  Mail,
  Linkedin,
  Globe,
  Calendar,
  Award,
  ArrowLeft,
  Upload,
  Camera
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProfileForm {
  bio: string
  gender: string
  rate_hourly?: number
  rate_flat?: number
  travel_km?: number
  abn?: string
  phone_number?: string
  preferred_contact_method?: string
  contact_availability?: string
  linkedin_url?: string
  years_experience?: number
  coaching_philosophy?: string
  achievements?: string
  avatar_url?: string
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

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" }
]

import { SuburbSelector } from "@/components/ui/suburb-selector"

export default function CoachProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [suburbs, setSuburbs] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const supabase = createClient()
  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch } = useForm<ProfileForm>()
  
  useEffect(() => {
    loadProfile()
  }, [])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty || specialties.length > 0 || suburbs.length > 0)
  }, [isDirty, specialties, suburbs])
  
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
      setValue('gender', profile.gender || '')
      setValue('rate_hourly', profile.rate_hourly || undefined)
      setValue('rate_flat', profile.rate_flat || undefined)
      setValue('travel_km', profile.travel_km || undefined)
      setValue('abn', profile.abn || '')
      setValue('phone_number', profile.phone_number || '')
      setValue('preferred_contact_method', profile.preferred_contact_method || 'email')
      setValue('contact_availability', profile.contact_availability || '')
      setValue('linkedin_url', profile.linkedin_url || '')
      setValue('years_experience', profile.years_experience || 0)
      setValue('coaching_philosophy', profile.coaching_philosophy || '')
      setValue('achievements', profile.achievements || '')
      setValue('avatar_url', profile.avatar_url || '')
      setAvatarUrl(profile.avatar_url || null)
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

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    } else {
      router.push('/coach/profile')
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      setError(null)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('No user found')

      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setValue('avatar_url', publicUrl)
      setHasUnsavedChanges(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploadingAvatar(false)
    }
  }
  
  
  const onSubmit = async (data: ProfileForm) => {
    if (specialties.length === 0) {
      setError("Please select at least one specialty")
      return
    }
    
    if (suburbs.length === 0) {
      setError("Please select at least one service area")
      return
    }
    
    if (!data.gender) {
      setError("Please select your gender")
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
        gender: data.gender,
        specialties,
        suburbs,
        rate_hourly: data.rate_hourly || null,
        rate_flat: data.rate_flat || null,
        travel_km: data.travel_km || null,
        abn: data.abn || null,
        phone_number: data.phone_number || null,
        preferred_contact_method: data.preferred_contact_method || 'email',
        contact_availability: data.contact_availability || null,
        linkedin_url: data.linkedin_url || null,
        avatar_url: avatarUrl || null,
        years_experience: data.years_experience || 0,
        coaching_philosophy: data.coaching_philosophy || null,
        achievements: data.achievements || null,
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
      setHasUnsavedChanges(false)  // Reset unsaved changes after successful save
      setTimeout(() => {
        setSuccess(false)
        router.push('/coach/profile')  // Navigate back to profile after successful save
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackClick}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold">Edit Coach Profile</h1>
        </div>
        {hasUnsavedChanges && (
          <Badge variant="secondary" className="text-orange-600">
            Unsaved changes
          </Badge>
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedDialog(false)
                router.push('/coach/profile')
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Leave Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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

        {/* Profile Picture */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a professional photo to help organizations recognize you
          </p>

          <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold">
                  <User className="w-12 h-12" />
                </div>
              )}

              {/* Upload Button Overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>

            {/* Upload Instructions */}
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Upload a new photo</p>
              <p className="text-xs text-muted-foreground mb-3">
                JPG, PNG or GIF. Max file size 5MB. Recommended size 400x400px.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {uploadingAvatar ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Contact Information */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This information will only be shared with organizations after they accept your application
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone_number"
                  type="tel"
                  className="pl-10"
                  placeholder="0412 345 678"
                  {...register("phone_number")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
              <Select
                defaultValue="email"
                onValueChange={(value) => setValue('preferred_contact_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="both">Either Email or Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_availability">Contact Availability</Label>
              <Input
                id="contact_availability"
                type="text"
                placeholder="e.g., Weekdays 9am-5pm"
                {...register("contact_availability")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="linkedin_url"
                  type="url"
                  className="pl-10"
                  placeholder="https://linkedin.com/in/yourprofile"
                  {...register("linkedin_url")}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Bio Section */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">About You</h2>

          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="coaching_philosophy">Coaching Philosophy</Label>
              <Textarea
                id="coaching_philosophy"
                rows={3}
                placeholder="Describe your coaching approach and philosophy..."
                {...register("coaching_philosophy")}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of Experience</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="years_experience"
                    type="number"
                    className="pl-10"
                    placeholder="5"
                    min="0"
                    {...register("years_experience", {
                      min: { value: 0, message: "Years must be positive" }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievements">Key Achievements</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="achievements"
                    type="text"
                    className="pl-10"
                    placeholder="e.g., State Champion 2023"
                    {...register("achievements")}
                  />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        
        {/* Gender */}
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">Gender</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This helps organizations find the right coach for their specific needs
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select onValueChange={(value) => setValue('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
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
          <SuburbSelector
            value={suburbs}
            onChange={setSuburbs}
            label="Service Areas"
            description="Select up to 10 Sydney suburbs where you can provide coaching services"
            maxSuburbs={10}
            required={true}
            error={suburbs.length === 0 ? "Please select at least one service area" : undefined}
          />
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
            onClick={handleBackClick}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
